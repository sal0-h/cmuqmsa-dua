import { NextRequest, NextResponse } from "next/server";
import { query, run } from "@/lib/db";
import type { Dua } from "@/lib/db";
import { checkAdminAuth } from "@/lib/admin-auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { title, arabic_text, translation, transliteration, commentary, source, category, status } = body;

    const MAX_LEN = { title: 500, arabic_text: 5000, translation: 2000, transliteration: 2000, commentary: 2000, source: 500 };
    const s = (v: unknown) => (typeof v === "string" ? v : "");
    if (title !== undefined && s(title).length > MAX_LEN.title) return NextResponse.json({ error: "Title too long" }, { status: 400 });
    if (arabic_text !== undefined && s(arabic_text).length > MAX_LEN.arabic_text) return NextResponse.json({ error: "Arabic text too long" }, { status: 400 });
    if (translation !== undefined && s(translation).length > MAX_LEN.translation) return NextResponse.json({ error: "Translation too long" }, { status: 400 });
    if (transliteration !== undefined && s(transliteration).length > MAX_LEN.transliteration) return NextResponse.json({ error: "Transliteration too long" }, { status: 400 });
    if (commentary !== undefined && s(commentary).length > MAX_LEN.commentary) return NextResponse.json({ error: "Commentary too long" }, { status: 400 });
    if (source !== undefined && s(source).length > MAX_LEN.source) return NextResponse.json({ error: "Source too long" }, { status: 400 });

    const updates: string[] = [];
    const values: unknown[] = [];
    let i = 1;

    if (title !== undefined) { updates.push(`title = $${i++}`); values.push(title); }
    if (arabic_text !== undefined) { updates.push(`arabic_text = $${i++}`); values.push(arabic_text); }
    if (translation !== undefined) { updates.push(`translation = $${i++}`); values.push(translation); }
    if (transliteration !== undefined) { updates.push(`transliteration = $${i++}`); values.push(transliteration); }
    if (commentary !== undefined) { updates.push(`commentary = $${i++}`); values.push(commentary); }
    if (source !== undefined) { updates.push(`source = $${i++}`); values.push(source); }
    if (category !== undefined) { updates.push(`category = $${i++}`); values.push(category); }
    if (status !== undefined) {
      const s = status === "Pending" ? "Pending" : status === "Approved" ? "Approved" : null;
      if (s) {
        updates.push(`status = $${i++}`);
        values.push(s);
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    values.push(id);
    await run(`UPDATE duas SET ${updates.join(", ")} WHERE id = $${i}`, values);

    const rows = await query<Dua>("SELECT * FROM duas WHERE id = $1", [id]);
    return NextResponse.json(rows[0] ?? {});
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await run("DELETE FROM duas WHERE id = $1", [id]);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
