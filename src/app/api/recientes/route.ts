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
  rutaConvocatoria: string;
}

const ALL = (rawData as RawRecord[]).map((r) => ({
  ...r,
  // plazo fields not present in this dataset
  plazoInicio: null,
  plazoFin: null,
  fechaFinSolicitud: null,
  textFin: null,
  abierto: null,
  presupuestoTotal: null,
  tipoConvocatoria: null,
}));

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const busqueda = searchParams.get("busqueda")?.trim().toLowerCase() ?? "";
  const nivel1   = searchParams.get("nivel1") ?? "";
  const nivel2   = searchParams.get("nivel2") ?? "";
  const fechaDesde = searchParams.get("fechaDesde") ?? "";
  const fechaHasta = searchParams.get("fechaHasta") ?? "";
  const page     = Math.max(0, parseInt(searchParams.get("page") ?? "0", 10));
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("pageSize") ?? String(PAGE_SIZE), 10))
  );

  let filtered = ALL;

  if (nivel1) {
    filtered = filtered.filter((r) => r.nivel1 === nivel1);
  }
  if (nivel2) {
    filtered = filtered.filter((r) =>
      r.nivel2.toLowerCase().includes(nivel2.toLowerCase())
    );
  }
  if (fechaDesde) {
    filtered = filtered.filter((r) => r.fechaRecepcion >= fechaDesde);
  }
  if (fechaHasta) {
    filtered = filtered.filter((r) => r.fechaRecepcion <= fechaHasta);
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
