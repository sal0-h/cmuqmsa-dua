/**
 * Remove duplicate duas. Keeps the first (by created_at), deletes the rest.
 * Run: npm run dedupe-duas
 */

import Database from "better-sqlite3";
import { join } from "path";
import { existsSync } from "fs";

const dataDir = join(process.cwd(), "data");
const dbPath = process.env.DATABASE_PATH || join(dataDir, "duamaker.db");

if (!existsSync(dbPath)) {
  console.error("Database not found at", dbPath);
  process.exit(1);
}

const db = new Database(dbPath);

function normalize(s: string): string {
  return s
    .replace(/\s+/g, "")
    .replace(/ٱ/g, "ا")
    .replace(/ـ/g, "")
    .replace(/\u064B/g, "") // fathatan
    .replace(/\u064C/g, "") // dammatan
    .replace(/\u064D/g, "") // kasratan
    .replace(/\u064E/g, "") // fatha
    .replace(/\u064F/g, "") // damma
    .replace(/\u0650/g, "") // kasra
    .replace(/\u0651/g, "") // shadda
    .replace(/\u0652/g, "") // sukun
    .replace(/\u0670/g, ""); // superscript alif
}

function main() {
  const rows = db.prepare("SELECT id, title, arabic_text, created_at FROM duas ORDER BY created_at").all() as Array<{
    id: string;
    title: string;
    arabic_text: string;
    created_at: string;
  }>;

  const seen = new Map<string, { id: string; title: string }>();
  const toDelete: string[] = [];

  for (const row of rows) {
    const norm = normalize(row.arabic_text);
    if (norm.length < 5) continue; // skip very short (Subhanallah etc - different contexts)

    const existing = seen.get(norm);
    if (existing) {
      toDelete.push(row.id);
      console.log(`  Duplicate: "${row.title}" [${row.id}]`);
      console.log(`    → same as "${existing.title}" [${existing.id}]`);
    } else {
      seen.set(norm, { id: row.id, title: row.title });
    }
  }

  // Also remove exact translation duplicates (same meaning, different Arabic spelling)
  const transRows = db.prepare("SELECT id, title, translation FROM duas").all() as Array<{
    id: string;
    title: string;
    translation: string;
  }>;
  const transSeen = new Map<string, string>();
  for (const row of transRows) {
    const key = (row.translation || "").trim();
    if (!key) continue;
    const existingId = transSeen.get(key);
    if (existingId && existingId !== row.id && !toDelete.includes(row.id)) {
      const existing = transRows.find((r) => r.id === existingId)!;
      const keep = existing.title.length >= row.title.length ? existingId : row.id;
      const del = keep === existingId ? row.id : existingId;
      if (!toDelete.includes(del)) {
        toDelete.push(del);
        console.log(`  Translation dup: "${transRows.find((r) => r.id === del)!.title}" [${del}]`);
      }
    } else if (!existingId) {
      transSeen.set(key, row.id);
    }
  }

  if (toDelete.length === 0) {
    console.log("No duplicates found.");
    return;
  }

  console.log(`\nRemoving ${toDelete.length} duplicate(s)...`);
  const delStmt = db.prepare("DELETE FROM duas WHERE id = ?");
  const transaction = db.transaction(() => {
    for (const id of toDelete) {
      delStmt.run(id);
    }
  });
  transaction();
  console.log("Done.");
}

main();
