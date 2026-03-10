import { NextRequest, NextResponse } from "next/server";
import { query, run, generateId } from "@/lib/db";

function checkAdminAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const password = authHeader?.replace("Bearer ", "");
  return password === process.env.ADMIN_PASSWORD;
}

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
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
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
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid request body" },
      { status: 400 }
    );
  }
}
