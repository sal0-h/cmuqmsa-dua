-- DuaMaker: SQLite schema (also auto-created on first run)
-- For reference only - the app creates tables automatically

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_order INTEGER NOT NULL DEFAULT 0
);

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
);
