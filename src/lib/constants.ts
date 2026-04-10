import { NivelAdministrativo } from "./types";

export const PAGE_SIZE = 20;

export const BDNS_BASE_URL = "https://www.subvenciones.gob.es/bdnstrans/GE/es/convocatoria";
export const BDNS_API_URL = "https://www.subvenciones.gob.es/bdnstrans/api/convocatorias/busqueda";

export const NIVELES: { label: string; value: NivelAdministrativo | "" }[] = [
  { label: "Todos los niveles", value: "" },
  { label: "Estatal", value: "ESTADO" },
  { label: "Autonómica", value: "AUTONOMICA" },
  { label: "Local", value: "LOCAL" },
  { label: "Otros", value: "OTROS" },
];

/** Comunidades Autónomas — label shown in UI, dbValue is exact nivel2 stored in DB */
export const CCAA_OPCIONES: { label: string; dbValue: string }[] = [
  { label: "Andalucía",            dbValue: "ANDALUCÍA" },
  { label: "Aragón",               dbValue: "ARAGÓN" },
  { label: "Asturias",             dbValue: "PRINCIPADO DE ASTURIAS" },
  { label: "Canarias",             dbValue: "CANARIAS" },
  { label: "Cantabria",            dbValue: "CANTABRIA" },
  { label: "Castilla y León",      dbValue: "CASTILLA Y LEÓN" },
  { label: "Castilla-La Mancha",   dbValue: "CASTILLA-LA MANCHA" },
  { label: "Cataluña",             dbValue: "CATALUÑA" },
  { label: "Ceuta",                dbValue: "CIUDAD AUTÓNOMA DE CEUTA" },
  { label: "C. Valenciana",        dbValue: "COMUNITAT VALENCIANA" },
  { label: "Extremadura",          dbValue: "EXTREMADURA" },
  { label: "Galicia",              dbValue: "GALICIA" },
  { label: "Illes Balears",        dbValue: "ILLES BALEARS" },
  { label: "La Rioja",             dbValue: "LA RIOJA" },
  { label: "Madrid",               dbValue: "COMUNIDAD DE MADRID" },
  { label: "Melilla",              dbValue: "CIUDAD AUTÓNOMA DE MELILLA" },
  { label: "Murcia",               dbValue: "REGIÓN DE MURCIA" },
  { label: "Navarra",              dbValue: "COMUNIDAD FORAL DE NAVARRA" },
  { label: "País Vasco",           dbValue: "PAÍS VASCO" },
];

/**
 * Provincias — keyword is matched via LIKE '%keyword%' against nivel2.
 * Covers Diputaciones Provinciales, Diputaciones Forales, Cabildos Insulares
 * and the main capitals that appear directly as nivel2.
 */
export const PROVINCIAS_OPCIONES: { label: string; keyword: string }[] = [
  // Andalucía
  { label: "Almería",      keyword: "ALMERÍA" },
  { label: "Cádiz",        keyword: "CÁDIZ" },
  { label: "Córdoba",      keyword: "CÓRDOBA" },
  { label: "Granada",      keyword: "GRANADA" },
  { label: "Huelva",       keyword: "HUELVA" },
  { label: "Jaén",         keyword: "JAÉN" },
  { label: "Málaga",       keyword: "MÁLAGA" },
  { label: "Sevilla",      keyword: "SEVILLA" },
  // Aragón
  { label: "Huesca",       keyword: "HUESCA" },
  { label: "Teruel",       keyword: "TERUEL" },
  { label: "Zaragoza",     keyword: "ZARAGOZA" },
  // Canarias
  { label: "Gran Canaria", keyword: "GRAN CANARIA" },
  { label: "Tenerife",     keyword: "TENERIFE" },
  { label: "Fuerteventura",keyword: "FUERTEVENTURA" },
  { label: "Lanzarote",    keyword: "LANZAROTE" },
  { label: "La Palma",     keyword: "LA PALMA" },
  { label: "La Gomera",    keyword: "LA GOMERA" },
  { label: "El Hierro",    keyword: "EL HIERRO" },
  // Castilla y León
  { label: "Ávila",        keyword: "AVILA" },
  { label: "Burgos",       keyword: "BURGOS" },
  { label: "León",         keyword: "LEÓN" },
  { label: "Palencia",     keyword: "PALENCIA" },
  { label: "Salamanca",    keyword: "SALAMANCA" },
  { label: "Segovia",      keyword: "SEGOVIA" },
  { label: "Soria",        keyword: "SORIA" },
  { label: "Valladolid",   keyword: "VALLADOLID" },
  { label: "Zamora",       keyword: "ZAMORA" },
  // Castilla-La Mancha
  { label: "Albacete",     keyword: "ALBACETE" },
  { label: "Ciudad Real",  keyword: "CIUDAD REAL" },
  { label: "Cuenca",       keyword: "CUENCA" },
  { label: "Guadalajara",  keyword: "GUADALAJARA" },
  { label: "Toledo",       keyword: "TOLEDO" },
  // Cataluña
  { label: "Barcelona",    keyword: "BARCELONA" },
  { label: "Girona",       keyword: "GIRONA" },
  { label: "Lleida",       keyword: "LLEIDA" },
  { label: "Tarragona",    keyword: "TARRAGONA" },
  // Extremadura
  { label: "Badajoz",      keyword: "BADAJOZ" },
  { label: "Cáceres",      keyword: "CÁCERES" },
  // Galicia
  { label: "A Coruña",     keyword: "A CORUÑA" },
  { label: "Lugo",         keyword: "LUGO" },
  { label: "Ourense",      keyword: "OURENSE" },
  { label: "Pontevedra",   keyword: "PONTEVEDRA" },
  // C. Valenciana
  { label: "Alicante",     keyword: "ALICANTE" },
  { label: "Castellón",    keyword: "CASTELLÓN" },
  { label: "Valencia",     keyword: "VALENCIA" },
  // Madrid
  { label: "Madrid",       keyword: "MADRID" },
  // Murcia
  { label: "Murcia",       keyword: "MURCIA" },
  // Navarra
  { label: "Navarra",      keyword: "NAVARRA" },
  // País Vasco
  { label: "Álava",        keyword: "ALAVA" },
  { label: "Bizkaia",      keyword: "BIZKAIA" },
  { label: "Gipuzkoa",     keyword: "GUIPUZKOA" },
  // Asturias
  { label: "Asturias",     keyword: "ASTURIAS" },
  // Cantabria
  { label: "Cantabria",    keyword: "CANTABRIA" },
  // La Rioja
  { label: "La Rioja",     keyword: "RIOJA" },
];
