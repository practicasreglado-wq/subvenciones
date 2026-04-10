"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, X, Search } from "lucide-react";

interface Option {
  label: string;
  value: string;
}

interface MultiSelectFilterProps {
  label: string;
  options: Option[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

export default function MultiSelectFilter({
  label,
  options,
  selected,
  onChange,
  placeholder = "Buscar…",
}: MultiSelectFilterProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  function toggle(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  }

  const active = selected.length > 0;

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-1 block text-xs font-medium text-slate-400">
        {label}
      </label>
      <button
        type="button"
        onClick={() => { setOpen(!open); setSearch(""); }}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
          active
            ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
            : "border-slate-700 bg-slate-800 text-white hover:border-slate-600"
        }`}
      >
        <span className="truncate">
          {selected.length === 0
            ? <span className="text-slate-500">Todas</span>
            : selected.length === 1
              ? options.find((o) => o.value === selected[0])?.label ?? selected[0]
              : `${selected.length} seleccionadas`}
        </span>
        <div className="flex shrink-0 items-center gap-1">
          {active && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); onChange([]); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onChange([]); }}}
              className="rounded p-0.5 hover:bg-slate-700"
            >
              <X className="h-3 w-3" />
            </span>
          )}
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-56 rounded-xl border border-slate-700 bg-slate-900 shadow-xl">
          {/* Search */}
          <div className="flex items-center gap-2 border-b border-slate-800 px-3 py-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-slate-500" />
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={placeholder}
              className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>

          {/* Options */}
          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-xs text-slate-500">Sin resultados</p>
            ) : (
              filtered.map((o) => {
                const checked = selected.includes(o.value);
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => toggle(o.value)}
                    className={`flex w-full items-center gap-2.5 px-3 py-1.5 text-sm hover:bg-slate-800 ${
                      checked ? "text-emerald-400" : "text-slate-300"
                    }`}
                  >
                    <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      checked
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-slate-600"
                    }`}>
                      {checked && (
                        <svg viewBox="0 0 10 8" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 4l3 3 5-6" />
                        </svg>
                      )}
                    </span>
                    {o.label}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          {selected.length > 0 && (
            <div className="border-t border-slate-800 px-3 py-2">
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs text-slate-500 hover:text-white"
              >
                Limpiar selección
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
