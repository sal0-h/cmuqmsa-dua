import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await query(
      "UPDATE duas SET popularity_score = popularity_score + 1 WHERE id = $1 AND status = 'Approved'",
      [id]
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Database error" },
      { status: 500 }
    );
  }
}
