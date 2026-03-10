import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const rows = await query<{ name: string }>(
      "SELECT name FROM categories ORDER BY display_order, name"
    );
    return NextResponse.json(rows.map((r) => r.name).filter(Boolean));
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Database error" },
      { status: 500 }
    );
  }
}
