import { NextRequest, NextResponse } from "next/server";
import { execSync } from "child_process";
import { writeFileSync, readFileSync, mkdtempSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { query } from "@/lib/db";
import { formatDuasAsLatex } from "@/lib/latex";
import type { Dua } from "@/lib/db";

const MAX_IDS = 100;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body as { ids: string[] };

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids required" }, { status: 400 });
    }

    const limited = ids.slice(0, MAX_IDS).filter((id) => typeof id === "string");
    if (limited.length === 0) {
      return NextResponse.json({ error: "No valid ids" }, { status: 400 });
    }

    const placeholders = limited.map((_, i) => `$${i + 1}`).join(", ");
    const rows = await query<Dua>(
      `SELECT * FROM duas WHERE status = 'Approved' AND id IN (${placeholders})`,
      limited
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "No duas found" }, { status: 404 });
    }

    const tex = formatDuasAsLatex(rows);
    const dir = mkdtempSync(join(tmpdir(), "dua-export-"));
    const base = "dua-list";
    const texPath = join(dir, `${base}.tex`);

    writeFileSync(texPath, tex, "utf8");

    try {
      execSync(`xelatex -interaction=nonstopmode -output-directory=${dir} "${texPath}"`, {
        timeout: 60000,
        stdio: "pipe",
      });
    } catch (err) {
      const msg =
        err instanceof Error && err.message?.includes("ENOENT")
          ? "xelatex not found. Use Docker for PDF export."
          : "PDF compilation failed";
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    const pdfPath = join(dir, `${base}.pdf`);
    const pdf = readFileSync(pdfPath);

    try {
      rmSync(dir, { recursive: true });
    } catch {
      /* ignore */
    }

    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="dua-list.pdf"`,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
