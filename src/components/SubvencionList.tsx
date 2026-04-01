"use client";

import { SearchX } from "lucide-react";
import { Subvencion } from "@/lib/types";
import SubvencionCard from "./SubvencionCard";

interface SubvencionListProps {
  subvenciones: Subvencion[];
  isFavorite: (id: number) => boolean;
  onToggleFavorite: (id: number) => void;
  loading?: boolean;
}

export default function SubvencionList({
  subvenciones,
  isFavorite,
  onToggleFavorite,
  loading,
}: SubvencionListProps) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl border border-slate-800 bg-slate-900/50 p-5"
          >
            <div className="mb-3 flex gap-2">
              <div className="h-5 w-20 rounded-md bg-slate-800" />
            </div>
            <div className="mb-2 h-4 w-full rounded bg-slate-800" />
            <div className="mb-4 h-4 w-3/4 rounded bg-slate-800" />
            <div className="h-3 w-1/2 rounded bg-slate-800" />
          </div>
        ))}
      </div>
    );
  }

  if (subvenciones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <SearchX className="mb-4 h-12 w-12 text-slate-700" />
        <h3 className="mb-2 text-lg font-medium text-slate-400">
          No se encontraron subvenciones
        </h3>
        <p className="text-sm text-slate-600">
          Prueba a modificar los filtros o el texto de búsqueda
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {subvenciones.map((sub) => (
        <SubvencionCard
          key={sub.id}
          subvencion={sub}
          isFavorite={isFavorite(sub.id)}
          onToggleFavorite={() => onToggleFavorite(sub.id)}
        />
      ))}
    </div>
  );
}
