import { BDNS_BASE_URL } from "./constants";
import { NivelAdministrativo } from "./types";

export function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/(?:^|\s|[-/])\S/g, (match) => match.toUpperCase());
}

export function formatDateES(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "...";
}

export function buildBDNSUrl(numeroConvocatoria: string): string {
  return `${BDNS_BASE_URL}/${numeroConvocatoria}`;
}

export function getNivelColor(nivel: NivelAdministrativo): string {
  switch (nivel) {
    case "ESTADO":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "AUTONOMICA":
      return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    case "LOCAL":
      return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    default:
      return "bg-slate-500/20 text-slate-400 border-slate-500/30";
  }
}

export function getNivelLabel(nivel: NivelAdministrativo): string {
  switch (nivel) {
    case "ESTADO":
      return "Estatal";
    case "AUTONOMICA":
      return "Autonómica";
    case "LOCAL":
      return "Local";
    default:
      return nivel;
  }
}
