import { NextRequest, NextResponse } from "next/server";
import { query, run, generateId } from "@/lib/db";
import { checkAdminAuth } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending";
    const sql =
      status === "all"
        ? "SELECT * FROM duas ORDER BY created_at DESC"
        : "SELECT * FROM duas WHERE status = 'Pending' ORDER BY created_at DESC";
    const rows = await query(sql);
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, arabic_text, translation, transliteration, commentary, source, category, status } = body;

    if (!title || !arabic_text || !translation || !category) {
      return NextResponse.json(
        { error: "Missing required fields: title, arabic_text, translation, category" },
        { status: 400 }
      );
    }

    const MAX_LEN = { title: 500, arabic_text: 5000, translation: 2000, transliteration: 2000, commentary: 2000, source: 500 };
    const s = (v: unknown) => (typeof v === "string" ? v : "");
    if (s(title).length > MAX_LEN.title) return NextResponse.json({ error: "Title too long" }, { status: 400 });
    if (s(arabic_text).length > MAX_LEN.arabic_text) return NextResponse.json({ error: "Arabic text too long" }, { status: 400 });
    if (s(translation).length > MAX_LEN.translation) return NextResponse.json({ error: "Translation too long" }, { status: 400 });
    if (s(transliteration).length > MAX_LEN.transliteration) return NextResponse.json({ error: "Transliteration too long" }, { status: 400 });
    if (s(commentary).length > MAX_LEN.commentary) return NextResponse.json({ error: "Commentary too long" }, { status: 400 });
    if (s(source).length > MAX_LEN.source) return NextResponse.json({ error: "Source too long" }, { status: 400 });

    const validCats = await query<{ name: string }>("SELECT name FROM categories");
    const validNames = new Set(validCats.map((r) => r.name));
    if (!validNames.has(category.trim())) {
      return NextResponse.json(
        { error: "Invalid category. Must be one of: " + [...validNames].join(", ") },
        { status: 400 }
      );
    }

    const id = generateId();
    await run(
      `INSERT INTO duas (id, title, arabic_text, translation, transliteration, commentary, source, category, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        id,
        title,
        arabic_text,
        translation,
        transliteration || null,
        commentary || null,
        source || null,
        category,
        status === "Pending" ? "Pending" : "Approved",
      ]
    );

    return NextResponse.json({ success: true, id });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
