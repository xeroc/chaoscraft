import { Pool, PoolConfig, QueryResult } from "pg";

// Database client interface
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

// PostgreSQL client
class Client implements DbClient {
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
    let lastInsertId = 0;
    if (result.rows.length > 0 && result.rows[0].id) {
      lastInsertId = result.rows[0].id;
    }
    return {
      changes: result.rowCount || 0,
      lastInsertId,
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

// Initialize database based on configuration
export async function getDb(): Promise<DbClient> {
  if (dbClient) {
    return dbClient;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL environment variable is required for PostgreSQL",
    );
  }

  dbClient = new Client(connectionString);
  await initializeTables(dbClient);
  return dbClient;
}

// Initialize tables
async function initializeTables(client: DbClient): Promise<void> {
  const paymentsSql = `
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
  `;

  const requestsSql = `
    CREATE TABLE IF NOT EXISTS requests (
      id SERIAL PRIMARY KEY,
      issue_number INTEGER NOT NULL,
      request_text TEXT NOT NULL,
      status TEXT NOT NULL,
      commit TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (issue_number) REFERENCES payments(issue_number)
    );
  `;

  await client.run(paymentsSql);
  await client.run(requestsSql);
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
