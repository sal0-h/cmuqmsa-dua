/**
 * Generate a sample .tex file and compile with xelatex.
 * Run: npx tsx scripts/test-latex.ts
 */

import { writeFileSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import { query } from "../lib/db";
import { formatDuasAsLatex } from "../lib/latex";
import type { Dua } from "../lib/db";

async function main() {
  const rows = await query<Dua>(
    "SELECT id, title, arabic_text, translation, transliteration, commentary, source, category, status, popularity_score, created_at FROM duas WHERE status = 'Approved' LIMIT 5"
  );

  if (rows.length === 0) {
    console.log("No approved duas in DB. Run 'npm run seed' first.");
    process.exit(1);
  }

  const outDir = join(process.cwd(), "data");
  const texPath = join(outDir, "dua-list-test.tex");

  const content = formatDuasAsLatex(rows);
  writeFileSync(texPath, content, "utf8");
  console.log(`Wrote ${texPath} (${rows.length} duas)`);

  try {
    execSync(`xelatex -output-directory=${outDir} -interaction=nonstopmode "${texPath}"`, {
      stdio: "inherit",
      cwd: outDir,
    });
    console.log("\nCompilation successful. Output: data/dua-list-test.pdf");
  } catch (err) {
    console.error("\nCompilation failed.");
    process.exit(1);
  }
}

main();
