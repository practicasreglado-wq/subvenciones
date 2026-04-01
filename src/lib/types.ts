export interface Subvencion {
  id: number;
  mrr: boolean;
  numeroConvocatoria: string;
  descripcion: string;
  descripcionLeng: string | null;
  fechaRecepcion: string;
  nivel1: NivelAdministrativo;
  nivel2: string;
  nivel3: string | null;
  codigoInvente: string | null;
  // Scraped from detail API (nullable until scraper:plazos runs)
  plazoInicio: string | null;
  plazoFin: string | null;
  fechaFinSolicitud: string | null;  // ISO date if exact
  textFin: string | null;            // free text if no exact date
  abierto: boolean | null;
  presupuestoTotal: number | null;
  tipoConvocatoria: string | null;
}

export type NivelAdministrativo = "ESTADO" | "AUTONOMICA" | "LOCAL";

export interface SubvencionesResponse {
  content: Subvencion[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
  numberOfElements: number;
}

export interface SearchFilters {
  busqueda: string;
  nivel1: NivelAdministrativo | "";
  nivel2: string;
  fechaDesde: string;
  fechaHasta: string;
  soloAbiertas: boolean;
}
