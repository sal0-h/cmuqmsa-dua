/**
 * Analyze CLOSE duplicates (similar but not identical duas).
 * Report only - does not remove anything.
 * Run: npm run analyze-close-dupes
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
  const dist = levenshtein(a, b);
  return 1 - dist / maxLen;
}

function wordOverlap(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter((w) => w.length > 2));
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter((w) => w.length > 2));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let overlap = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) overlap++;
  }
  return overlap / Math.min(wordsA.size, wordsB.size);
}

type Dua = { id: string; title: string; arabic_text: string; translation: string; category: string };

function main() {
  const rows = db.prepare("SELECT id, title, arabic_text, translation, category FROM duas").all() as Dua[];

  const pairs: Array<{
    a: Dua;
    b: Dua;
    arabicSim: number;
    transSim: number;
    transOverlap: number;
    reason: string;
  }> = [];

  for (let i = 0; i < rows.length; i++) {
    for (let j = i + 1; j < rows.length; j++) {
      const a = rows[i];
      const b = rows[j];

      const normA = normalizeArabic(a.arabic_text);
      const normB = normalizeArabic(b.arabic_text);

      const arabicSim = similarity(normA, normB);
      const transSim = similarity((a.translation || "").trim(), (b.translation || "").trim());
      const transOverlap = wordOverlap(a.translation || "", b.translation || "");

      const aInB = normA.length > 10 && normB.includes(normA);
      const bInA = normB.length > 10 && normA.includes(normB);

      let reason = "";
      if (arabicSim >= 0.85 && arabicSim < 1) {
        reason = `Arabic ~${(arabicSim * 100).toFixed(0)}% similar`;
      } else if (aInB || bInA) {
        reason = "One Arabic is substring of the other";
      } else if (transOverlap >= 0.8 && transOverlap < 1) {
        reason = `Translation ~${(transOverlap * 100).toFixed(0)}% word overlap`;
      } else if (transSim >= 0.7 && transSim < 1) {
        reason = `Translation ~${(transSim * 100).toFixed(0)}% similar`;
      }

      if (reason) {
        pairs.push({ a, b, arabicSim, transSim, transOverlap, reason });
      }
    }
  }

  // Sort by strongest similarity
  pairs.sort((x, y) => Math.max(y.arabicSim, y.transSim, y.transOverlap) - Math.max(x.arabicSim, x.transSim, x.transOverlap));

  console.log("=== CLOSE DUPLICATES (analysis only, no removal) ===\n");
  console.log(`Found ${pairs.length} pairs of similar duas.\n`);

  for (const { a, b, arabicSim, transSim, transOverlap, reason } of pairs) {
    const score = Math.max(arabicSim, transSim, transOverlap);
    console.log(`[${(score * 100).toFixed(0)}%] ${reason}`);
    console.log(`  A: "${a.title}" [${a.category}]`);
    console.log(`     ${a.arabic_text.slice(0, 80)}${a.arabic_text.length > 80 ? "…" : ""}`);
    console.log(`  B: "${b.title}" [${b.category}]`);
    console.log(`     ${b.arabic_text.slice(0, 80)}${b.arabic_text.length > 80 ? "…" : ""}`);
    console.log("");
  }
}

main();
