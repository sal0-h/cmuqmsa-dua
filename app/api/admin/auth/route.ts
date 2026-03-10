import { NextRequest, NextResponse } from "next/server";
import {
  verifyPassword,
  createSessionToken,
  checkAuthRateLimit,
} from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  try {
    if (!checkAuthRateLimit(request)) {
      return NextResponse.json(
        { error: "Too many login attempts. Try again in 15 minutes." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { password } = body;

    if (!process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
    }

    if (typeof password !== "string") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    if (verifyPassword(password)) {
      const token = createSessionToken();
      return NextResponse.json({ success: true, token });
    }

    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
