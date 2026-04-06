"use client";

import { ExternalLink, Calendar, Building2, Zap, Clock, Euro } from "lucide-react";
import { Subvencion } from "@/lib/types";
import {
  toTitleCase,
  formatDateES,
  buildBDNSUrl,
  getNivelColor,
  getNivelLabel,
  getTipoConvLabel,
  isFondoEuropeo,
  isPERTE,
  truncateText,
} from "@/lib/utils";
import FavoriteStar from "./FavoriteStar";

interface SubvencionCardProps {
  subvencion: Subvencion;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

/** Format plazo: ISO date → Spanish locale, or raw text truncated */
function formatPlazo(raw: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return formatDateES(raw);
  if (/^(\d{2})\/(\d{2})\/(\d{4})$/.test(raw)) {
    const [d, m, y] = raw.split("/");
    return formatDateES(`${y}-${m}-${d}`);
  }
  return truncateText(raw, 55);
}

/** Colour-code plazo by days remaining (only for exact ISO dates) */
function plazoColor(raw: string | null): string {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return "text-slate-400";
  const diff = (new Date(raw).getTime() - Date.now()) / 86_400_000;
  if (diff < 0)   return "text-slate-600 line-through";
  if (diff <= 7)  return "text-red-400 font-semibold";
  if (diff <= 30) return "text-amber-400";
  return "text-emerald-400";
}

function formatBudget(amount: number): string {
  if (amount >= 1_000_000)
    return `${(amount / 1_000_000).toLocaleString("es-ES", { maximumFractionDigits: 1 })} M€`;
  if (amount >= 1_000)
    return `${(amount / 1_000).toLocaleString("es-ES", { maximumFractionDigits: 0 })} K€`;
  return `${amount.toLocaleString("es-ES")} €`;
}

export default function SubvencionCard({
  subvencion,
  isFavorite,
  onToggleFavorite,
}: SubvencionCardProps) {
  const url = buildBDNSUrl(subvencion.numeroConvocatoria);
  const hasRealPlazo  = !!subvencion.plazoFin;
  const tipoConvLabel = getTipoConvLabel(subvencion.tipoConvocatoria);
  const esEuropeo     = isFondoEuropeo(subvencion.descripcion);
  const esPERTE       = isPERTE(subvencion.descripcion);

  // Open/closed is determined by fechaFinSolicitud vs today (date-based, not scraped flag)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineDate = subvencion.fechaFinSolicitud ? new Date(subvencion.fechaFinSolicitud) : null;
  const isOpen   = deadlineDate !== null && deadlineDate >= today;
  const isClosed = deadlineDate !== null && deadlineDate < today;
  const sinPlazo = deadlineDate === null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-xl border border-slate-800 bg-slate-900/50 p-5 hover:border-slate-700 hover:bg-slate-900"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">

          {/* ── Badges ── */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${getNivelColor(subvencion.nivel1)}`}>
              {getNivelLabel(subvencion.nivel1)}
            </span>

            {isOpen && (
              <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Abierta
              </span>
            )}
            {isClosed && (
              <span className="inline-flex items-center rounded-md border border-slate-600 bg-slate-800/60 px-2 py-0.5 text-xs text-slate-500">
                Cerrada
              </span>
            )}
            {sinPlazo && (
              <span className="inline-flex items-center rounded-md border border-slate-700 bg-slate-800/40 px-2 py-0.5 text-xs text-slate-600">
                Sin plazo
              </span>
            )}
            {esPERTE && (
              <span className="inline-flex items-center gap-1 rounded-md border border-yellow-500/40 bg-yellow-500/15 px-2 py-0.5 text-xs font-medium text-yellow-400">
                <Zap className="h-3 w-3" />
                PERTE
              </span>
            )}
            {esEuropeo && (
              <span className="inline-flex items-center gap-1 rounded-md border border-indigo-500/40 bg-indigo-500/15 px-2 py-0.5 text-xs font-medium text-indigo-400">
                ★ EU
              </span>
            )}
            {tipoConvLabel && (
              <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${
                tipoConvLabel === "Competitiva"
                  ? "border-sky-500/30 bg-sky-500/15 text-sky-400"
                  : "border-slate-600 bg-slate-800/60 text-slate-500"
              }`}>
                {tipoConvLabel}
              </span>
            )}
            {subvencion.mrr && (
              <span className="inline-flex items-center gap-1 rounded-md border border-blue-500/30 bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-400">
                <Zap className="h-3 w-3" />
                MRR
              </span>
            )}
          </div>

          {/* ── Title ── */}
          <h3 className="mb-3 text-sm font-semibold leading-snug text-white group-hover:text-emerald-400">
            {truncateText(toTitleCase(subvencion.descripcion), 150)}
          </h3>

          {/* ── Organismo ── */}
          <div className="mb-2.5 flex items-center gap-2 text-xs text-slate-400">
            <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-600" />
            <span className="truncate">{toTitleCase(subvencion.nivel2)}</span>
            {subvencion.nivel3 && (
              <>
                <span className="text-slate-700">·</span>
                <span className="truncate text-slate-500">{toTitleCase(subvencion.nivel3)}</span>
              </>
            )}
          </div>

          {/* ── Dates + budget ── */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">

            {/* Fecha conv. */}
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-600" />
              <span className="text-slate-600">Fecha conv.</span>
              <span className="text-slate-400">{formatDateES(subvencion.fechaRecepcion)}</span>
            </span>

            {/* Plazo */}
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 shrink-0 text-slate-600" />
              <span className="text-slate-600">Plazo</span>
              {hasRealPlazo ? (
                <span className={plazoColor(subvencion.fechaFinSolicitud)}>
                  {formatPlazo(subvencion.plazoFin!)}
                </span>
              ) : (
                <span className="text-slate-600 underline decoration-dotted">
                  ver convocatoria
                </span>
              )}
            </span>

            {/* Presupuesto */}
            {subvencion.presupuestoTotal != null && subvencion.presupuestoTotal > 0 && (
              <span className="flex items-center gap-1.5">
                <Euro className="h-3.5 w-3.5 shrink-0 text-slate-600" />
                <span className="text-slate-400">{formatBudget(subvencion.presupuestoTotal)}</span>
              </span>
            )}
          </div>

        </div>

        {/* ── Actions ── */}
        <div className="flex shrink-0 flex-col items-center gap-1">
          <FavoriteStar active={isFavorite} onClick={onToggleFavorite} />
          <ExternalLink className="h-4 w-4 text-slate-700 group-hover:text-slate-500" />
        </div>
      </div>
    </a>
  );
}
