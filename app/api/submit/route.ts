import { NextRequest, NextResponse } from "next/server";
import { run, query, generateId } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, arabic_text, translation, transliteration, commentary, source, category } = body;

    if (!title || !arabic_text || !translation || !category) {
      return NextResponse.json(
        { error: "Missing required fields: title, arabic_text, translation, category" },
        { status: 400 }
      );
    }

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
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Pending')`,
      [
        id,
        title,
        arabic_text,
        translation,
        transliteration || null,
        commentary || null,
        source || null,
        category,
      ]
    );

    return NextResponse.json({ success: true, id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid request body" },
      { status: 400 }
    );
  }
}
