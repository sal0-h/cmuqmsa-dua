import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { checkVoteRateLimit } from "@/lib/admin-auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkVoteRateLimit(request)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { id } = await params;

  try {
    await query(
      "UPDATE duas SET popularity_score = popularity_score + 1 WHERE id = $1 AND status = 'Approved'",
      [id]
    );
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
