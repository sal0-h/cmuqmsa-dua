import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body as { ids: string[] };

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json([]);
    }

    const placeholders = ids.map((_, i) => `$${i + 1}`).join(", ");
    const rows = await query(
      `SELECT * FROM duas WHERE status = 'Approved' AND id IN (${placeholders})`,
      ids
    );

    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid request" },
      { status: 400 }
    );
  }
}
