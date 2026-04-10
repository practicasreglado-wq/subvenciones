import { NextRequest, NextResponse } from "next/server";
import { getDb, DbConvocatoria } from "@/lib/db";
import { PAGE_SIZE } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const busqueda        = searchParams.get("busqueda")?.trim() ?? "";
  const nivel1          = searchParams.get("nivel1") ?? "";
  const ccaa            = searchParams.getAll("ccaa").filter(Boolean);
  const provincias      = searchParams.getAll("provincias").filter(Boolean);
  const fechaDesde      = searchParams.get("fechaDesde") ?? "";
  const fechaHasta      = searchParams.get("fechaHasta") ?? "";
  const soloAbiertas    = searchParams.get("soloAbiertas") === "true";
  const presupuestoRango = searchParams.get("presupuestoRango") ?? "";
  const tipoConv        = searchParams.get("tipoConv") ?? "";
  const soloPerte       = searchParams.get("soloPerte") === "true";
  const soloEuropeos    = searchParams.get("soloEuropeos") === "true";
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

    // CCAA: exact match against nivel2 (IN clause)
    if (ccaa.length > 0) {
      const ph = ccaa.map(() => "?").join(",");
      conditions.push(`nivel2 IN (${ph})`);
      params.push(...ccaa);
    }

    // Provincias: LIKE keyword match against nivel2 (OR across selected)
    if (provincias.length > 0) {
      const provClauses = provincias.map(() => "nivel2 LIKE ?").join(" OR ");
      conditions.push(`(${provClauses})`);
      params.push(...provincias.map((kw) => `%${kw}%`));
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
      conditions.push("fechaFinSolicitud IS NOT NULL AND fechaFinSolicitud >= date('now')");
    }
    if (presupuestoRango) {
      if (presupuestoRango === "0-50000")        conditions.push("presupuestoTotal > 0 AND presupuestoTotal <= 50000");
      else if (presupuestoRango === "50000-500000")   conditions.push("presupuestoTotal > 50000 AND presupuestoTotal <= 500000");
      else if (presupuestoRango === "500000-5000000") conditions.push("presupuestoTotal > 500000 AND presupuestoTotal <= 5000000");
      else if (presupuestoRango === "5000000+")       conditions.push("presupuestoTotal > 5000000");
    }
    if (tipoConv === "competitiva") {
      conditions.push("tipoConvocatoria LIKE '%competitiva%'");
    } else if (tipoConv === "directa") {
      conditions.push("tipoConvocatoria LIKE '%directa%'");
    }
    if (soloPerte) {
      conditions.push("descripcion LIKE '%PERTE%'");
    }
    if (soloEuropeos) {
      conditions.push("(descripcion LIKE '%FEDER%' OR descripcion LIKE '%FSE%' OR descripcion LIKE '%FEADER%' OR descripcion LIKE '%Next Generation%' OR descripcion LIKE '%Horizonte Europa%' OR descripcion LIKE '%INTERREG%' OR descripcion LIKE '%REACT-EU%')");
    }

    let rows: DbConvocatoria[];
    let totalElements: number;

    if (busqueda) {
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
