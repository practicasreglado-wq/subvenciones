import { NextRequest, NextResponse } from "next/server";
import { PAGE_SIZE } from "@/lib/constants";
import rawData from "@/data/ultimasConvocatorias.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RawRecord {
  id: number;
  mrr: boolean;
  numeroConvocatoria: string;
  descripcion: string;
  descripcionLeng: string | null;
  fechaRecepcion: string;
  nivel1: string;
  nivel2: string;
  nivel3: string | null;
  codigoInvente: string | null;
  plazoInicio?: string | null;
  plazoFin?: string | null;
  fechaFinSolicitud?: string | null;
  textInicio?: string | null;
  textFin?: string | null;
  abierto?: boolean | null;
  presupuestoTotal?: number | null;
  tipoConvocatoria?: string | null;
}

const ALL = (rawData as RawRecord[]).map((r) => ({
  ...r,
  plazoInicio:       r.plazoInicio       ?? null,
  plazoFin:          r.plazoFin          ?? null,
  fechaFinSolicitud: r.fechaFinSolicitud ?? null,
  textInicio:        r.textInicio        ?? null,
  textFin:           r.textFin           ?? null,
  abierto:           r.abierto           ?? null,
  presupuestoTotal:  r.presupuestoTotal  ?? null,
  tipoConvocatoria:  r.tipoConvocatoria  ?? null,
}));

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const busqueda        = searchParams.get("busqueda")?.trim().toLowerCase() ?? "";
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
  const page     = Math.max(0, parseInt(searchParams.get("page") ?? "0", 10));
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("pageSize") ?? String(PAGE_SIZE), 10))
  );

  const today = new Date().toISOString().split("T")[0];

  let filtered = ALL;

  if (nivel1) {
    filtered = filtered.filter((r) => r.nivel1 === nivel1);
  }
  if (ccaa.length > 0) {
    filtered = filtered.filter((r) => ccaa.includes(r.nivel2.toUpperCase()));
  }
  if (provincias.length > 0) {
    filtered = filtered.filter((r) => {
      const n2 = r.nivel2.toUpperCase();
      return provincias.some((kw) => n2.includes(kw.toUpperCase()));
    });
  }
  if (fechaDesde) {
    filtered = filtered.filter((r) => r.fechaRecepcion >= fechaDesde);
  }
  if (fechaHasta) {
    filtered = filtered.filter((r) => r.fechaRecepcion <= fechaHasta);
  }
  if (soloAbiertas) {
    filtered = filtered.filter(
      (r) => r.fechaFinSolicitud != null && r.fechaFinSolicitud >= today
    );
  }
  if (presupuestoRango) {
    filtered = filtered.filter((r) => {
      const p = r.presupuestoTotal;
      if (p == null || p <= 0) return false;
      if (presupuestoRango === "0-50000")         return p <= 50_000;
      if (presupuestoRango === "50000-500000")    return p > 50_000   && p <= 500_000;
      if (presupuestoRango === "500000-5000000")  return p > 500_000  && p <= 5_000_000;
      if (presupuestoRango === "5000000+")        return p > 5_000_000;
      return true;
    });
  }
  if (tipoConv) {
    filtered = filtered.filter((r) =>
      r.tipoConvocatoria?.toLowerCase().includes(tipoConv) ?? false
    );
  }
  if (soloPerte) {
    filtered = filtered.filter((r) => r.descripcion.toUpperCase().includes("PERTE"));
  }
  if (soloEuropeos) {
    const EU = ["FEDER", "FSE", "FEADER", "FEAGA", "INTERREG", "NEXT GENERATION", "HORIZONTE EUROPA", "REACT-EU"];
    filtered = filtered.filter((r) => {
      const up = r.descripcion.toUpperCase();
      return EU.some((kw) => up.includes(kw));
    });
  }
  if (busqueda) {
    const terms = busqueda.split(/\s+/).filter(Boolean);
    filtered = filtered.filter((r) => {
      const haystack = (r.descripcion + " " + (r.descripcionLeng ?? "") + " " + r.nivel2).toLowerCase();
      return terms.every((t) => haystack.includes(t));
    });
  }

  const totalElements = filtered.length;
  const totalPages    = Math.ceil(totalElements / pageSize);
  const content       = filtered.slice(page * pageSize, (page + 1) * pageSize);

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
}
