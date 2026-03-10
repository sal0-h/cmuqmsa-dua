import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || "";
  const sort = searchParams.get("sort") || "newest";
  const search = searchParams.get("search") || "";

  const orderBy = sort === "popularity" ? "popularity_score DESC" : "created_at DESC";
  const params: string[] = ["Approved"];
  const conditions: string[] = ["status = $1"];

  if (category) {
    params.push(category);
    conditions.push(`category = $${params.length}`);
  }

  if (search) {
    const like = `%${search}%`;
    params.push(like, like, like);
    const n = params.length;
    conditions.push(`(title LIKE $${n - 2} OR translation LIKE $${n - 1} OR transliteration LIKE $${n})`);
  }

  const sql = `SELECT * FROM duas WHERE ${conditions.join(" AND ")} ORDER BY ${orderBy}`;

  try {
    const rows = await query(sql, params);
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
