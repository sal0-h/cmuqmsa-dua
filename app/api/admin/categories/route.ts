import { NextRequest, NextResponse } from "next/server";
import { query, run, generateId } from "@/lib/db";
import { checkAdminAuth } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const rows = await query<{ id: string; name: string; display_order: number }>(
      "SELECT id, name, display_order FROM categories ORDER BY display_order, name"
    );
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
    const { name } = body;
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name required" }, { status: 400 });
    }
    const id = generateId();
    const maxOrder = (await query<{ m: number }>("SELECT COALESCE(MAX(display_order), -1) + 1 as m FROM categories"))[0]?.m ?? 0;
    await run("INSERT INTO categories (id, name, display_order) VALUES ($1, $2, $3)", [id, name.trim(), maxOrder]);
    return NextResponse.json({ id, name: name.trim() });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const count = await query<{ n: number }>("SELECT COUNT(*) as n FROM duas WHERE category = (SELECT name FROM categories WHERE id = $1)", [id]);
    const n = count[0]?.n ?? 0;
    if (n > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${n} dua(s) use this category. Reassign them first.` },
        { status: 400 }
      );
    }
    await run("DELETE FROM categories WHERE id = $1", [id]);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
