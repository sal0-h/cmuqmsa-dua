/**
 * Merge fragmented categories into broader groups.
 * Run: npm run merge-categories
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

type Merge = { into: string; from: string[] };
const MERGES: Merge[] = [
  { into: "Daily Adhkar", from: ["Morning", "Evening"] },
  { into: "Weather & Natural", from: ["Rain", "Thunder", "Wind Storm", "New Moon"] },
  { into: "Death & Funeral", from: ["Death", "Funeral"] },
  { into: "Trials & Difficulty", from: ["Distress", "Difficulty"] },
  { into: "Commerce", from: ["Buying", "Market"] },
  { into: "Purification", from: ["Wudoo", "Toilet"] },
  { into: "Eating & Drinking", from: ["Eating", "Drinking"] },
  { into: "Travel", from: ["Descending", "Farewell"] },
  { into: "Sleep", from: ["Dreams"] },
  { into: "General", from: ["The Sick", "Aakhirah (Hereafter)", "Al-Maseeh Ad-Dajjal", "Harvest", "Insult", "Love for Allah", "Omens", "Protection from Evil", "Shirk"] },
];

function ensureCategory(name: string): void {
  const existing = db.prepare("SELECT 1 FROM categories WHERE name = ?").get(name);
  if (!existing) {
    const { randomUUID } = require("crypto");
    const maxOrder =
      (db.prepare("SELECT COALESCE(MAX(display_order), -1) + 1 as m FROM categories").get() as { m: number })?.m ?? 0;
    db.prepare("INSERT INTO categories (id, name, display_order) VALUES (?, ?, ?)").run(
      randomUUID(),
      name,
      maxOrder
    );
    console.log(`  + category: ${name}`);
  }
}

function main() {
  console.log("Merging categories...\n");

  const transaction = db.transaction(() => {
    for (const { into, from } of MERGES) {
      const affected = from.filter((c) => {
        const count = (db.prepare("SELECT COUNT(*) as n FROM duas WHERE category = ?").get(c) as { n: number }).n;
        return count > 0;
      });
      if (affected.length === 0) continue;

      ensureCategory(into);

      for (const cat of affected) {
        const result = db.prepare("UPDATE duas SET category = ? WHERE category = ?").run(into, cat);
        if (result.changes > 0) {
          console.log(`  ${cat} → ${into} (${result.changes} duas)`);
        }
      }
    }

    // Remove orphaned categories (no duas use them)
    const used = new Set(
      (db.prepare("SELECT DISTINCT category FROM duas").all() as { category: string }[]).map((r) => r.category)
    );
    const allCats = db.prepare("SELECT id, name FROM categories").all() as { id: string; name: string }[];
    for (const cat of allCats) {
      if (!used.has(cat.name)) {
        db.prepare("DELETE FROM categories WHERE id = ?").run(cat.id);
        console.log(`  - removed unused category: ${cat.name}`);
      }
    }
  });

  transaction();
  console.log("\nDone.");
}

main();
