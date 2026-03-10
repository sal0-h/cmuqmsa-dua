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
    const rows = await query<{ id: string; name: string; display_order: number }>(
      "SELECT id, name, display_order FROM categories ORDER BY display_order, name"
    );
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
    const { name } = body;
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name required" }, { status: 400 });
    }
    const id = generateId();
    const maxOrder = (await query<{ m: number }>("SELECT COALESCE(MAX(display_order), -1) + 1 as m FROM categories"))[0]?.m ?? 0;
    await run("INSERT INTO categories (id, name, display_order) VALUES ($1, $2, $3)", [id, name.trim(), maxOrder]);
    return NextResponse.json({ id, name: name.trim() });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
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
    await run("DELETE FROM categories WHERE id = $1", [id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}
