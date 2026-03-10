import Database from "better-sqlite3";
import { randomUUID } from "crypto";
import { mkdirSync, existsSync } from "fs";
import { join } from "path";

const dataDir = join(process.cwd(), "data");
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DATABASE_PATH || join(dataDir, "duamaker.db");
const db = new Database(dbPath);

// Enable WAL for better concurrent access (like al-amanah)
db.pragma("journal_mode = WAL");
db.pragma("synchronous = NORMAL");

// Create tables if not exist
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    display_order INTEGER NOT NULL DEFAULT 0
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS duas (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    arabic_text TEXT NOT NULL,
    translation TEXT NOT NULL,
    transliteration TEXT,
    commentary TEXT,
    source TEXT,
    category TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved')),
    popularity_score INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  )
`);

// Seed default categories if empty
const catCount = db.prepare("SELECT COUNT(*) as n FROM categories").get() as { n: number };
if (catCount.n === 0) {
  const defaults = ["Exams", "Marriage", "Health", "Travel", "General"];
  const stmt = db.prepare("INSERT INTO categories (id, name, display_order) VALUES (?, ?, ?)");
  defaults.forEach((name, i) => stmt.run(randomUUID(), name, i));
}

export type Dua = {
  id: string;
  title: string;
  arabic_text: string;
  translation: string;
  transliteration: string | null;
  commentary: string | null;
  source: string | null;
  category: string;
  status: "Pending" | "Approved";
  popularity_score: number;
  created_at: string;
};

function toSqlitePlaceholders(sql: string): string {
  return sql.replace(/\$\d+/g, "?");
}

export function query<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
  const stmt = db.prepare(toSqlitePlaceholders(sql));
  return Promise.resolve(stmt.all(...params) as T[]);
}

export function run(sql: string, params: unknown[] = []): Promise<{ lastInsertRowid: number }> {
  const stmt = db.prepare(toSqlitePlaceholders(sql));
  return Promise.resolve(stmt.run(...params) as { lastInsertRowid: number });
}

export function generateId(): string {
  return randomUUID();
}
