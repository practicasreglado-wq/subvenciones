"use client";

import { SlidersHorizontal, X, Zap } from "lucide-react";
import { useState } from "react";
import { NIVELES, CCAA_OPCIONES, PROVINCIAS_OPCIONES } from "@/lib/constants";
import { SearchFilters, PresupuestoRango, TipoConv } from "@/lib/types";
import MultiSelectFilter from "./MultiSelectFilter";

interface FilterPanelProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
}

type DatePreset = "hoy" | "semana" | "mes" | "";

function getPresetDates(preset: DatePreset): { fechaDesde: string; fechaHasta: string } {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split("T")[0];

  if (preset === "hoy") {
    const s = fmt(today);
    return { fechaDesde: s, fechaHasta: s };
  }
  if (preset === "semana") {
    const day = today.getDay();
    const diffToMon = (day === 0 ? -6 : 1 - day);
    const mon = new Date(today);
    mon.setDate(today.getDate() + diffToMon);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    return { fechaDesde: fmt(mon), fechaHasta: fmt(sun) };
  }
  if (preset === "mes") {
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return { fechaDesde: fmt(first), fechaHasta: fmt(last) };
  }
  return { fechaDesde: "", fechaHasta: "" };
}

function detectPreset(fechaDesde: string, fechaHasta: string): DatePreset {
  if (!fechaDesde && !fechaHasta) return "";
  const check = getPresetDates;
  if (JSON.stringify(check("hoy")) === JSON.stringify({ fechaDesde, fechaHasta })) return "hoy";
  if (JSON.stringify(check("semana")) === JSON.stringify({ fechaDesde, fechaHasta })) return "semana";
  if (JSON.stringify(check("mes")) === JSON.stringify({ fechaDesde, fechaHasta })) return "mes";
  return "";
}

const CCAA_OPTIONS = CCAA_OPCIONES.map((c) => ({ label: c.label, value: c.dbValue }));
const PROV_OPTIONS = PROVINCIAS_OPCIONES.map((p) => ({ label: p.label, value: p.keyword }));

export default function FilterPanel({ filters, onChange }: FilterPanelProps) {
  const [open, setOpen] = useState(false);

  const hasFilters = !!(
    filters.nivel1 ||
    filters.ccaa.length ||
    filters.provincias.length ||
    filters.fechaDesde ||
    filters.fechaHasta ||
    filters.soloAbiertas ||
    filters.presupuestoRango ||
    filters.tipoConv ||
    filters.soloPerte ||
    filters.soloEuropeos
  );
  const activePreset = detectPreset(filters.fechaDesde, filters.fechaHasta);

  const clearFilters = () => {
    onChange({
      ...filters,
      nivel1: "",
      ccaa: [],
      provincias: [],
      fechaDesde: "",
      fechaHasta: "",
      soloAbiertas: false,
      presupuestoRango: "",
      tipoConv: "",
      soloPerte: false,
      soloEuropeos: false,
    });
  };

  const TIPO_CONV_OPCIONES: { label: string; value: TipoConv }[] = [
    { label: "Todos los tipos",   value: "" },
    { label: "Competitiva",       value: "competitiva" },
    { label: "Concesión directa", value: "directa" },
  ];

  const PRESUPUESTO_OPCIONES: { label: string; value: PresupuestoRango }[] = [
    { label: "Cualquier importe", value: "" },
    { label: "Hasta 50.000 €",   value: "0-50000" },
    { label: "50K – 500K €",     value: "50000-500000" },
    { label: "500K – 5M €",      value: "500000-5000000" },
    { label: "Más de 5M €",      value: "5000000+" },
  ];

  const applyPreset = (preset: DatePreset) => {
    if (preset === activePreset) {
      onChange({ ...filters, fechaDesde: "", fechaHasta: "" });
    } else {
      const dates = getPresetDates(preset);
      onChange({ ...filters, ...dates });
    }
  };

  const presets: { label: string; value: DatePreset }[] = [
    { label: "Hoy", value: "hoy" },
    { label: "Esta semana", value: "semana" },
    { label: "Este mes", value: "mes" },
  ];

  // Active filter count for badge
  const filterCount = [
    filters.nivel1,
    filters.ccaa.length ? "x" : "",
    filters.provincias.length ? "x" : "",
    filters.fechaDesde || filters.fechaHasta ? "x" : "",
    filters.soloAbiertas ? "x" : "",
    filters.presupuestoRango,
    filters.tipoConv,
    filters.soloPerte ? "x" : "",
    filters.soloEuropeos ? "x" : "",
  ].filter(Boolean).length;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {/* Main toggle */}
        <button
          onClick={() => setOpen(!open)}
          className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium ${
            open || hasFilters
              ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
              : "border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600 hover:text-white"
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
          {hasFilters && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
              {filterCount}
            </span>
          )}
        </button>

        {/* Date presets */}
        {presets.map((p) => (
          <button
            key={p.value}
            onClick={() => applyPreset(p.value)}
            className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
              activePreset === p.value
                ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                : "border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600 hover:text-white"
            }`}
          >
            {p.label}
          </button>
        ))}

        {/* Solo abiertas */}
        <button
          onClick={() => onChange({ ...filters, soloAbiertas: !filters.soloAbiertas })}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
            filters.soloAbiertas
              ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
              : "border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600 hover:text-white"
          }`}
        >
          {filters.soloAbiertas && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />}
          {!filters.soloAbiertas && <Zap className="h-3.5 w-3.5" />}
          Solo abiertas
        </button>

        {/* PERTE */}
        <button
          onClick={() => onChange({ ...filters, soloPerte: !filters.soloPerte })}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
            filters.soloPerte
              ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-400"
              : "border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600 hover:text-white"
          }`}
        >
          <Zap className="h-3.5 w-3.5" />
          PERTE
        </button>

        {/* Fondos europeos */}
        <button
          onClick={() => onChange({ ...filters, soloEuropeos: !filters.soloEuropeos })}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
            filters.soloEuropeos
              ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-400"
              : "border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600 hover:text-white"
          }`}
        >
          ★ EU
        </button>

        {/* Clear */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-400 hover:border-red-500/50 hover:text-red-400"
          >
            <X className="h-3 w-3" />
            Limpiar
          </button>
        )}
      </div>

      {open && (
        <div className="mt-3 grid gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">

          {/* Nivel administrativo */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">
              Nivel administrativo
            </label>
            <select
              value={filters.nivel1}
              onChange={(e) => onChange({ ...filters, nivel1: e.target.value as SearchFilters["nivel1"] })}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
            >
              {NIVELES.map((n) => (
                <option key={n.value} value={n.value}>
                  {n.label}
                </option>
              ))}
            </select>
          </div>

          {/* CCAA multi-select */}
          <MultiSelectFilter
            label="Comunidad Autónoma"
            options={CCAA_OPTIONS}
            selected={filters.ccaa}
            onChange={(ccaa) => onChange({ ...filters, ccaa })}
            placeholder="Buscar CCAA…"
          />

          {/* Provincias multi-select */}
          <MultiSelectFilter
            label="Provincia"
            options={PROV_OPTIONS}
            selected={filters.provincias}
            onChange={(provincias) => onChange({ ...filters, provincias })}
            placeholder="Buscar provincia…"
          />

          {/* Fecha desde */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">
              Fecha conv. desde
            </label>
            <input
              type="date"
              value={filters.fechaDesde}
              onChange={(e) => onChange({ ...filters, fechaDesde: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Fecha hasta */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">
              Fecha conv. hasta
            </label>
            <input
              type="date"
              value={filters.fechaHasta}
              onChange={(e) => onChange({ ...filters, fechaHasta: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Presupuesto */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">
              Presupuesto
            </label>
            <select
              value={filters.presupuestoRango}
              onChange={(e) => onChange({ ...filters, presupuestoRango: e.target.value as PresupuestoRango })}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none ${
                filters.presupuestoRango
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                  : "border-slate-700 bg-slate-800 text-white"
              }`}
            >
              {PRESUPUESTO_OPCIONES.map((o) => (
                <option key={o.value} value={o.value} className="bg-slate-800 text-white">
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo convocatoria — spans the row on larger screens */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">
              Tipo convocatoria
            </label>
            <select
              value={filters.tipoConv}
              onChange={(e) => onChange({ ...filters, tipoConv: e.target.value as TipoConv })}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none ${
                filters.tipoConv
                  ? "border-sky-500/50 bg-sky-500/10 text-sky-400"
                  : "border-slate-700 bg-slate-800 text-white"
              }`}
            >
              {TIPO_CONV_OPCIONES.map((o) => (
                <option key={o.value} value={o.value} className="bg-slate-800 text-white">
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
