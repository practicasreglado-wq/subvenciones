import { NextRequest, NextResponse } from "next/server";
import { getDb, DbConvocatoria } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDb();
    const row = db
      .prepare("SELECT * FROM convocatorias WHERE id = ?")
      .get(Number(params.id)) as DbConvocatoria | undefined;

    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...row,
      mrr: row.mrr === 1,
      abierto: row.abierto === null ? null : row.abierto === 1,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
