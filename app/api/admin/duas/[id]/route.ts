import { NextRequest, NextResponse } from "next/server";
import { query, run, type Dua } from "@/lib/db";

function checkAdminAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const password = authHeader?.replace("Bearer ", "");
  return password === process.env.ADMIN_PASSWORD;
}

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
    if (status !== undefined) { updates.push(`status = $${i++}`); values.push(status); }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    values.push(id);
    await run(`UPDATE duas SET ${updates.join(", ")} WHERE id = $${i}`, values);

    const rows = await query<Dua>("SELECT * FROM duas WHERE id = ?", [id]);
    return NextResponse.json(rows[0] ?? {});
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
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
    await query("DELETE FROM duas WHERE id = $1", [id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}
