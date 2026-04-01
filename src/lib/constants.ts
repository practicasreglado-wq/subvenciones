import { NivelAdministrativo } from "./types";

export const PAGE_SIZE = 20;

export const BDNS_BASE_URL = "https://www.subvenciones.gob.es/bdnstrans/GE/es/convocatoria";
export const BDNS_API_URL = "https://www.subvenciones.gob.es/bdnstrans/api/convocatorias/busqueda";

export const NIVELES: { label: string; value: NivelAdministrativo | "" }[] = [
  { label: "Todos los niveles", value: "" },
  { label: "Estatal", value: "ESTADO" },
  { label: "Autonómica", value: "AUTONOMICA" },
  { label: "Local", value: "LOCAL" },
];

export const COMUNIDADES_AUTONOMAS = [
  "Todas las regiones",
  "Andalucía",
  "Aragón",
  "Asturias",
  "Canarias",
  "Cantabria",
  "Castilla y León",
  "Castilla-La Mancha",
  "Cataluña",
  "Ceuta",
  "Comunidad Valenciana",
  "Extremadura",
  "Galicia",
  "Illes Balears",
  "La Rioja",
  "Madrid",
  "Melilla",
  "Murcia",
  "Navarra",
  "País Vasco",
];
