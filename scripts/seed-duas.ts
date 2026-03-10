/**
 * Seed DuaMaker with Sunni duas from trusted sources.
 * Sources: islamic-json (Bukhari, Muslim, etc.), Naikiyah API, duas.com
 * BLOCKLIST: Rejects any Shia-specific sources (Nahj al-Balagha, Al-Kafi, etc.)
 */

import Database from "better-sqlite3";
import { randomUUID } from "crypto";
import { mkdirSync, existsSync } from "fs";
import { join } from "path";

const dataDir = join(process.cwd(), "data");
if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
const dbPath = process.env.DATABASE_PATH || join(dataDir, "duamaker.db");
const db = new Database(dbPath);

// Shia source blocklist - reject any dua with these in source
const SHIA_SOURCE_BLOCKLIST = [
  /nahj\s*al-?balagh/i,
  /al-?kafi/i,
  /bihar\s*al-?anwar/i,
  /usul\s*al-?kafi/i,
  /man\s*la\s*yahduruhu/i,
  /al-?istibsar/i,
  /tahdhib\s*al-?ahkam/i,
  /kamil\s*al-?ziyarat/i,
  /majlisi/i,
  /kulayni/i,
  /saduq/i,
  /mufid/i,
  /tabarsi/i,
  /imam\s*(ali|hussain|husayn|hasan)\b/i,
];

function isShiaSource(source: string | null): boolean {
  if (!source) return false;
  return SHIA_SOURCE_BLOCKLIST.some((re) => re.test(source));
}

type SeedDua = {
  title: string;
  arabic_text: string;
  translation: string;
  transliteration?: string | null;
  source?: string | null;
  category: string;
};

const CATEGORY_MAP: Record<string, string> = {
  daily: "General",
  travel: "Travel",
  health: "Health",
  family: "General",
  food: "General",
  sleep: "General",
  morning: "General",
  evening: "General",
  "post-salah": "General",
  remembrance: "General",
  istigfar: "General",
  adhan: "General",
  "hajj and umrah": "Travel",
  "waking up": "General",
  eating: "General",
  toilet: "General",
  clothing: "General",
  mirror: "General",
  home: "General",
  exams: "Exams",
  marriage: "Marriage",
};

function normalizeCategory(raw: string): string {
  const key = raw.toLowerCase().trim();
  return CATEGORY_MAP[key] || "General";
}

function ensureCategory(name: string): void {
  const existing = db.prepare("SELECT 1 FROM categories WHERE name = ?").get(name);
  if (!existing) {
    const id = randomUUID();
    const maxOrder =
      (db.prepare("SELECT COALESCE(MAX(display_order), -1) + 1 as m FROM categories").get() as { m: number })?.m ?? 0;
    db.prepare("INSERT INTO categories (id, name, display_order) VALUES (?, ?, ?)").run(id, name, maxOrder);
    console.log(`  + category: ${name}`);
  }
}

function insertDua(d: SeedDua): boolean {
  if (isShiaSource(d.source ?? null)) return false;
  const existing = db.prepare("SELECT 1 FROM duas WHERE arabic_text = ? LIMIT 1").get(d.arabic_text);
  if (existing) return false;

  const id = randomUUID();
  db.prepare(
    `INSERT INTO duas (id, title, arabic_text, translation, transliteration, commentary, source, category, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Approved')`
  ).run(
    id,
    d.title,
    d.arabic_text,
    d.translation,
    d.transliteration ?? null,
    null,
    d.source ?? null,
    d.category
  );
  return true;
}

// --- islamic-json (Sunni: Bukhari, Muslim, Tirmidhi, Nasai, Ibn Majah) ---
async function fetchIslamicJson(): Promise<SeedDua[]> {
  const base = "https://raw.githubusercontent.com/adiman-dev/islamic-json/main";
  const out: SeedDua[] = [];

  for (const file of ["remembrance.json", "istigfar.json"]) {
    const url = `${base}/${file}`;
    const res = await fetch(url);
    if (!res.ok) continue;
    const arr = (await res.json()) as Array<{
      arabic: string;
      source?: string;
      toRepeat?: number;
      transliteration?: string;
      translations?: Array<{ lang: string; text: string }>;
    }>;
    const cat = file === "remembrance.json" ? "Post-Salah" : "Repentance";
    ensureCategory(cat);

    for (let i = 0; i < arr.length; i++) {
      const item = arr[i];
      const en = item.translations?.find((t) => t.lang === "en")?.text;
      if (!en) continue;
      out.push({
        title: `${cat} #${i + 1}`,
        arabic_text: item.arabic,
        translation: en,
        transliteration: item.transliteration ?? null,
        source: item.source ?? null,
        category: cat,
      });
    }
  }
  return out;
}

// --- Naikiyah API (Sunni, mainstream hadith) ---
async function fetchNaikiyah(): Promise<SeedDua[]> {
  const out: SeedDua[] = [];
  const useful = await fetch("https://dua-data-api.vercel.app/api/usefulDuas").then((r) => r.json());
  for (const d of useful) {
    const translation = d.translation ?? (d.description?.length > 60 ? d.description : null) ?? d.transliteration ?? "";
    if (!d.dua || !translation) continue;
    const cat = normalizeCategory(d.category ?? "daily");
    ensureCategory(cat);
    out.push({
      title: d.title,
      arabic_text: d.dua,
      translation,
      transliteration: d.transliteration ?? null,
      source: null,
      category: cat,
    });
  }
  return out;
}

// --- duas.com (Sunni: Tirmidhi, Bukhari, Muslim, Abu Dawud, etc.) ---
async function fetchDuasCom(): Promise<SeedDua[]> {
  const out: SeedDua[] = [];
  const seenUrls = new Set<string>();

  for (let page = 1; page <= 25; page++) {
    process.stdout.write(`   Page ${page}/25...\r`);
    const html = await fetch(`https://duas.com/search.php?search=&page=${page}`).then((r) => r.text());
    const matches = html.matchAll(/destURL="(\/dua\/\d+\/[^"]+)"/g);
    for (const m of matches) {
      const path = m[1];
      if (seenUrls.has(path)) continue;
      seenUrls.add(path);

      await new Promise((r) => setTimeout(r, 250)); // rate limit

      try {
        const pageHtml = await fetch(`https://duas.com${path}`, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; DuaMaker/1.0)" },
        }).then((r) => r.text());
        const titleMatch = pageHtml.match(/<title>([^<]+)<\/title>/i) ?? pageHtml.match(/<li class="active">([^<]+)<\/li>/);
        const title = titleMatch ? titleMatch[1].trim() : path.split("/").pop()?.replace(/-/g, " ") ?? "Dua";

        const arabicMatch =
          pageHtml.match(/>\s*([\u0600-\u06FF\s\u064B-\u0652\u0670،]+)\s*<\/div>\s*<div class="contentBox">/s) ??
          pageHtml.match(/>\s*([\u0600-\u06FF\s\u064B-\u0652\u0670،]{15,})\s*</);
        const arabic = arabicMatch ? arabicMatch[1].trim().slice(0, 2000) : null;

        const transBlock = pageHtml.match(/contentTitle[^>]*>Translation[\s\S]*?hiddenContent[^>]*>([\s\S]*?)<\/div>/i);
        const translation = transBlock
          ? (transBlock[1] as string).replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "").trim().slice(0, 2000)
          : null;

        const transLitBlock = pageHtml.match(/contentTitle[^>]*>Transliteration[\s\S]*?hiddenContent[^>]*>([\s\S]*?)<\/div>/i);
        const transliteration = transLitBlock
          ? (transLitBlock[1] as string).replace(/<[^>]+>/g, "").trim().slice(0, 1000)
          : null;

        const sourceMatch = pageHtml.match(/Sources?:\s*<a[^>]*>([^<]+)<\/a>/i);
        const source = sourceMatch ? sourceMatch[1].trim() : null;

        const catMatch = pageHtml.match(/<li><a href="[^"]*categories\[\]=\d+">([^<]+)<\/a><\/li>\s*<li><img/);
        const category = catMatch ? catMatch[1].trim() : "General";

        if (arabic && arabic.length > 3 && translation && translation.length > 10) {
          ensureCategory(category);
          out.push({
            title,
            arabic_text: arabic,
            translation,
            transliteration: transliteration || null,
            source: source || null,
            category,
          });
        }
      } catch {
        // skip failed page
      }
    }
  }
  return out;
}

// --- Main ---
async function main() {
  console.log("Seeding Sunni duas...\n");

  let total = 0;

  console.log("1. islamic-json (remembrance, istigfar)...");
  const ij = await fetchIslamicJson();
  for (const d of ij) {
    if (insertDua(d)) total++;
  }
  console.log(`   Done: ${ij.length} fetched, ${total} new`);

  console.log("2. Naikiyah API (usefulDuas)...");
  const before = total;
  const nk = await fetchNaikiyah();
  for (const d of nk) {
    if (insertDua(d)) total++;
  }
  console.log(`   Done: ${nk.length} fetched, ${total - before} new`);

  console.log("3. duas.com (Sunni hadith sources)...");
  const before2 = total;
  const dc = await fetchDuasCom();
  for (const d of dc) {
    if (insertDua(d)) total++;
  }
  console.log(`   Done: ${dc.length} fetched, ${total - before2} new`);

  console.log(`\nTotal new duas inserted: ${total}`);
}

main().catch(console.error);
