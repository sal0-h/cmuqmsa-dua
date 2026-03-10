/**
 * Merge high-confidence close duplicates (same Arabic, minor punctuation only).
 * Keeps the more descriptive title, removes the other.
 * Run: npm run merge-close-dupes
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

function normalizeArabic(s: string): string {
  return s
    .replace(/\s+/g, " ")
    .trim()
    .replace(/ٱ/g, "ا")
    .replace(/ـ/g, "");
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

function isIntentionalVariant(a: { title: string }, b: { title: string }): boolean {
  const titles = [a.title, b.title].join(" ").toLowerCase();
  if (titles.includes("for men") && titles.includes("for women")) return true;
  if (titles.includes("morning") && titles.includes("evening") && !titles.includes("and")) return true;
  return false;
}

type Dua = { id: string; title: string; arabic_text: string; translation: string; category: string };

function main() {
  const rows = db.prepare("SELECT id, title, arabic_text, translation, category FROM duas").all() as Dua[];

  const toDelete = new Set<string>();
  const merged: Array<{ keep: Dua; remove: Dua }> = [];

  for (let i = 0; i < rows.length; i++) {
    if (toDelete.has(rows[i].id)) continue;
    for (let j = i + 1; j < rows.length; j++) {
      if (toDelete.has(rows[j].id)) continue;

      const a = rows[i];
      const b = rows[j];

      if (isIntentionalVariant(a, b)) continue;

      const normA = normalizeArabic(a.arabic_text);
      const normB = normalizeArabic(b.arabic_text);
      const arabicSim = similarity(normA, normB);

      // Only merge when Arabic is 96%+ similar (same dua, punctuation/spacing diff)
      if (arabicSim < 0.96) continue;

      // Keep the one with longer/more descriptive title
      const keep = a.title.length >= b.title.length ? a : b;
      const remove = keep === a ? b : a;

      if (toDelete.has(remove.id)) continue;

      toDelete.add(remove.id);
      merged.push({ keep, remove });
    }
  }

  console.log("=== MERGE CLOSE DUPLICATES ===\n");
  if (merged.length === 0) {
    console.log("No high-confidence merges found.");
    return;
  }

  for (const { keep, remove } of merged) {
    console.log(`  Keep: "${keep.title}" [${keep.category}]`);
    console.log(`  Remove: "${remove.title}" [${remove.category}]`);
    console.log("");
  }

  console.log(`Removing ${toDelete.size} duplicate(s)...`);
  const delStmt = db.prepare("DELETE FROM duas WHERE id = ?");
  db.transaction(() => {
    for (const id of toDelete) {
      delStmt.run(id);
    }
  })();
  console.log("Done.");
}

main();
