import { NextRequest, NextResponse } from "next/server";
import { getDb, DbConvocatoria } from "@/lib/db";
import { PAGE_SIZE } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const busqueda = searchParams.get("busqueda")?.trim() ?? "";
  const nivel1 = searchParams.get("nivel1") ?? "";
  const nivel2 = searchParams.get("nivel2") ?? "";
  const fechaDesde = searchParams.get("fechaDesde") ?? "";
  const fechaHasta = searchParams.get("fechaHasta") ?? "";
  const soloAbiertas = searchParams.get("soloAbiertas") === "true";
  const page = Math.max(0, parseInt(searchParams.get("page") ?? "0", 10));
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("pageSize") ?? String(PAGE_SIZE), 10))
  );

  try {
    const db = getDb();

    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (nivel1) {
      conditions.push("nivel1 = ?");
      params.push(nivel1);
    }
    if (nivel2) {
      conditions.push("nivel2 LIKE ?");
      params.push(`%${nivel2}%`);
    }
    if (fechaDesde) {
      conditions.push("fechaRecepcion >= ?");
      params.push(fechaDesde);
    }
    if (fechaHasta) {
      conditions.push("fechaRecepcion <= ?");
      params.push(fechaHasta);
    }
    if (soloAbiertas) {
      conditions.push("abierto = 1");
    }

    let rows: DbConvocatoria[];
    let totalElements: number;

    if (busqueda) {
      // Use FTS for text search, join back to main table for filters
      const ftsQuery = busqueda
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => `"${w}"*`)
        .join(" OR ");

      const ftsConditions = conditions.length
        ? " AND " + conditions.join(" AND ")
        : "";

      const countSql = `
        SELECT COUNT(*) as n
        FROM convocatorias_fts f
        JOIN convocatorias c ON c.id = f.rowid
        WHERE convocatorias_fts MATCH ?
        ${ftsConditions}
      `;
      const dataSql = `
        SELECT c.*
        FROM convocatorias_fts f
        JOIN convocatorias c ON c.id = f.rowid
        WHERE convocatorias_fts MATCH ?
        ${ftsConditions}
        ORDER BY c.fechaRecepcion DESC
        LIMIT ? OFFSET ?
      `;

      const ftsParams = [ftsQuery, ...params];
      totalElements = (db.prepare(countSql).get(...ftsParams) as { n: number }).n;
      rows = db.prepare(dataSql).all(...ftsParams, pageSize, page * pageSize) as DbConvocatoria[];
    } else {
      const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";

      const countSql = `SELECT COUNT(*) as n FROM convocatorias ${where}`;
      const dataSql = `
        SELECT * FROM convocatorias
        ${where}
        ORDER BY fechaRecepcion DESC
        LIMIT ? OFFSET ?
      `;

      totalElements = (db.prepare(countSql).get(...params) as { n: number }).n;
      rows = db.prepare(dataSql).all(...params, pageSize, page * pageSize) as DbConvocatoria[];
    }

    const totalPages = Math.ceil(totalElements / pageSize);

    const content = rows.map((r) => ({
      ...r,
      mrr: r.mrr === 1,
      abierto: r.abierto === null ? null : r.abierto === 1,
    }));

    return NextResponse.json({
      content,
      totalElements,
      totalPages,
      number: page,
      size: pageSize,
      first: page === 0,
      last: page >= totalPages - 1,
      empty: content.length === 0,
      numberOfElements: content.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    // DB not found → serve from mock data fallback
    if (message.includes("not found")) {
      return NextResponse.json(
        { error: "Database not initialised. Run: npm run scrape" },
        { status: 503 }
      );
    }
    console.error("[/api/subvenciones]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
