import { SearchFilters, SubvencionesResponse, PresupuestoRango } from "./types";
import { PAGE_SIZE } from "./constants";

export async function fetchSubvenciones(
  filters: SearchFilters,
  page: number = 0,
  pageSize: number = PAGE_SIZE
): Promise<SubvencionesResponse> {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  if (filters.busqueda) params.set("busqueda", filters.busqueda);
  if (filters.nivel1)   params.set("nivel1",   filters.nivel1);
  if (filters.nivel2)   params.set("nivel2",   filters.nivel2);
  if (filters.fechaDesde) params.set("fechaDesde", filters.fechaDesde);
  if (filters.fechaHasta) params.set("fechaHasta", filters.fechaHasta);
  if (filters.soloAbiertas) params.set("soloAbiertas", "true");
  if (filters.presupuestoRango) params.set("presupuestoRango", filters.presupuestoRango);

  const res = await fetch(`/api/subvenciones?${params}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
