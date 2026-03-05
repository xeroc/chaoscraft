import Database from "better-sqlite3";
import { Pool, PoolConfig, QueryResult } from "pg";
import * as path from "path";
import * as fs from "fs";

type DbType = "sqlite" | "postgres";

interface DbConfig {
  type: DbType;
  sqlite?: {
    path: string;
  };
  postgres?: {
    connectionString: string;
    config?: PoolConfig;
  };
}

// Unified database interface
interface DbClient {
  query(sql: string, params?: any[]): Promise<any[]>;
  queryOne(sql: string, params?: any[]): Promise<any | undefined>;
  run(
    sql: string,
    params?: any[],
  ): Promise<{ changes: number; lastInsertId: number }>;
  transaction<T>(fn: () => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

// SQLite client implementation
class SqliteClient implements DbClient {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
  }

  async query(sql: string, params: any[] = []): Promise<any[]> {
    const stmt = this.db.prepare(sql);
    return stmt.all(...params) as any[];
  }

  async queryOne(sql: string, params: any[] = []): Promise<any | undefined> {
    const stmt = this.db.prepare(sql);
    return stmt.get(...params);
  }

  async run(
    sql: string,
    params: any[] = [],
  ): Promise<{ changes: number; lastInsertId: number }> {
    const stmt = this.db.prepare(sql);
    const result = stmt.run(...params);
    return {
      changes: result.changes,
      lastInsertId: result.lastInsertRowid as number,
    };
  }

  async transaction<T>(fn: () => Promise<T>): Promise<T> {
    const tx = this.db.transaction((syncFn: () => T) => syncFn());
    return fn().then((result) => {
      tx(() => result);
      return result;
    });
  }

  async close(): Promise<void> {
    this.db.close();
  }
}

// PostgreSQL client implementation
class PostgresClient implements DbClient {
  private pool: Pool;

  constructor(connectionString: string, config?: PoolConfig) {
    this.pool = new Pool({
      connectionString,
      ...config,
    });
  }

  async query(sql: string, params: any[] = []): Promise<any[]> {
    const result: QueryResult = await this.pool.query(sql, params);
    return result.rows;
  }

  async queryOne(sql: string, params: any[] = []): Promise<any | undefined> {
    const result: QueryResult = await this.pool.query(sql, params);
    return result.rows[0];
  }

  async run(
    sql: string,
    params: any[] = [],
  ): Promise<{ changes: number; lastInsertId: number }> {
    const result: QueryResult = await this.pool.query(sql, params);
    return {
      changes: result.rowCount || 0,
      lastInsertId: 0,
    };
  }

  async transaction<T>(fn: () => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await fn();
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

// Global database instance
let dbClient: DbClient | null = null;

// Get database type from environment
function getDbType(): DbType {
  const env = (process.env.DATABASE_TYPE || "sqlite").toLowerCase();
  if (env === "postgres" || env === "postgresql") {
    return "postgres";
  }
  return "sqlite";
}

// Initialize database based on configuration
export async function getDb(): Promise<DbClient> {
  if (dbClient) {
    return dbClient;
  }

  const dbType = getDbType();

  if (dbType === "postgres") {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        "DATABASE_URL environment variable is required for PostgreSQL",
      );
    }

    dbClient = new PostgresClient(connectionString);
  } else {
    const dbPath = path.join(process.cwd(), "data", "payments.db");
    const dataDir = path.join(process.cwd(), "data");

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    dbClient = new SqliteClient(dbPath);
  }

  await initializeTables(dbClient, dbType);
  return dbClient;
}

// Initialize tables with database-specific SQL
async function initializeTables(
  client: DbClient,
  dbType: DbType,
): Promise<void> {
  const paymentsSql =
    dbType === "postgres"
      ? `
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        issue_number INTEGER UNIQUE NOT NULL,
        payment_id TEXT NOT NULL,
        amount INTEGER NOT NULL,
        currency TEXT NOT NULL,
        payment_method TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        verified_at TIMESTAMP
      );
    `
      : `
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        issue_number INTEGER UNIQUE NOT NULL,
        payment_id TEXT NOT NULL,
        amount INTEGER NOT NULL,
        currency TEXT NOT NULL,
        payment_method TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        verified_at DATETIME
      );
    `;

  const requestsSql = `
    CREATE TABLE IF NOT EXISTS requests (
      id ${dbType === "postgres" ? "SERIAL" : "INTEGER"} PRIMARY KEY ${dbType === "postgres" ? "" : "AUTOINCREMENT"},
      issue_number INTEGER NOT NULL,
      request_text TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at ${dbType === "postgres" ? "TIMESTAMP" : "DATETIME"} DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (issue_number) REFERENCES payments(issue_number)
    );
  `;

  const indexesSql = `
    CREATE INDEX IF NOT EXISTS idx_payments_issue_number ON payments(issue_number);
    CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
    CREATE INDEX IF NOT EXISTS idx_requests_issue_number ON requests(issue_number);
  `;

  await client.run(paymentsSql);
  await client.run(requestsSql);
  // await client.run(indexesSql);
}

// Helper function for running queries
export async function query(sql: string, params: any[] = []): Promise<any[]> {
  const client = await getDb();
  return client.query(sql, params);
}

// Helper function for running single-row queries
export async function queryOne(
  sql: string,
  params: any[] = [],
): Promise<any | undefined> {
  const client = await getDb();
  return client.queryOne(sql, params);
}

// Helper function for running insert/update/delete
export async function run(
  sql: string,
  params: any[] = [],
): Promise<{ changes: number; lastInsertId: number }> {
  const client = await getDb();
  return client.run(sql, params);
}

// Helper function for transactions
export async function transaction<T>(fn: () => Promise<T>): Promise<T> {
  const client = await getDb();
  return client.transaction(fn);
}

// Close database
export async function closeDb(): Promise<void> {
  if (dbClient) {
    await dbClient.close();
    dbClient = null;
  }
}

// Ensure database is closed on process exit
if (typeof process !== "undefined") {
  process.on("exit", () => {
    if (dbClient) {
      closeDb().catch(console.error);
    }
  });
  process.on("SIGINT", async () => {
    await closeDb();
    process.exit(0);
  });
  process.on("SIGTERM", async () => {
    await closeDb();
    process.exit(0);
  });
}
