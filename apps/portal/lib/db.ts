import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

// Global database instance
let db: Database.Database | null = null

// Initialize SQLite database using better-sqlite3
export function getDb(): Database.Database {
  if (db) {
    return db
  }

  const dbPath = path.join(process.cwd(), 'data', 'payments.db')

  // Ensure data directory exists
  const dataDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  // Initialize database
  db = new Database(dbPath)

  // Enable WAL mode for better concurrent access
  db.pragma('journal_mode = WAL')

  // Initialize tables if they don't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      issue_number INTEGER UNIQUE NOT NULL,
      payment_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      currency TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      priority TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      verified_at DATETIME
    );
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      issue_number INTEGER NOT NULL,
      request_text TEXT NOT NULL,
      priority TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (issue_number) REFERENCES payments(issue_number)
    );
  `)

  // Create indexes for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_payments_issue_number ON payments(issue_number);
    CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
    CREATE INDEX IF NOT EXISTS idx_requests_issue_number ON requests(issue_number);
  `)

  return db
}

// Helper function for running queries
export function query(sql: string, params: any[] = []): any[] {
  const database = getDb()
  const stmt = database.prepare(sql)
  return stmt.all(...params)
}

// Helper function for running single-row queries
export function queryOne(sql: string, params: any[] = []): any | undefined {
  const database = getDb()
  const stmt = database.prepare(sql)
  return stmt.get(...params)
}

// Helper function for running insert/update/delete
export function run(sql: string, params: any[] = []): { changes: number; lastInsertRowid: number } {
  const database = getDb()
  const stmt = database.prepare(sql)
  const result = stmt.run(...params)
  return { changes: result.changes, lastInsertRowid: result.lastInsertRowid as number }
}

// Helper function for transactions
export function transaction<T>(fn: () => T): T {
  const database = getDb()
  const tx = database.transaction(fn)
  return tx()
}

// Close database
export function closeDb(): void {
  if (db) {
    db.close()
    db = null
  }
}

// Ensure database is closed on process exit
if (typeof process !== 'undefined') {
  process.on('exit', closeDb)
  process.on('SIGINT', () => {
    closeDb()
    process.exit(0)
  })
  process.on('SIGTERM', () => {
    closeDb()
    process.exit(0)
  })
}
