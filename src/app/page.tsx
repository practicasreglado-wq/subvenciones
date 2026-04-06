"use client";

import { useState, useMemo } from "react";
import { Sparkles, AlertCircle, Clock } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SearchBar from "@/components/SearchBar";
import FilterPanel from "@/components/FilterPanel";
import SubvencionList from "@/components/SubvencionList";
import Pagination from "@/components/Pagination";
import { useFavorites } from "@/hooks/useFavorites";
import { useDebounce } from "@/hooks/useDebounce";
import { useSubvenciones } from "@/hooks/useSubvenciones";
import { SearchFilters } from "@/lib/types";

const defaultFilters: SearchFilters = {
  busqueda: "",
  nivel1: "",
  nivel2: "",
  fechaDesde: "",
  fechaHasta: "",
  soloAbiertas: false,
  presupuestoRango: "",
  tipoConv: "",
  soloPerte: false,
  soloEuropeos: false,
};

function todayES(): string {
  return new Date().toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function HomePage() {
  const [searchText, setSearchText] = useState("");
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [page, setPage] = useState(0);
  const { favorites, isFavorite, toggleFavorite } = useFavorites();

  const debouncedSearch = useDebounce(searchText, 400);

  const activeFilters = useMemo(
    () => ({ ...filters, busqueda: debouncedSearch }),
    [filters, debouncedSearch]
  );

  const { data, loading, error } = useSubvenciones(activeFilters, page, "/api/recientes");

  const handleFilterChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    setPage(0);
  };

  const handleSearchChange = (value: string) => {
    setSearchText(value);
    setPage(0);
  };

  return (
    <>
      <Navbar favoritesCount={favorites.length} />

      <main className="flex-1">
        {/* Hero */}
        <div className="border-b border-slate-800/50 bg-gradient-to-b from-slate-900 to-slate-950 py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <div className="mb-4 flex items-center justify-center gap-2">
                <Clock className="h-5 w-5 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-400">
                  Últimas convocatorias publicadas
                </span>
              </div>
              <h1 className="mb-3 text-3xl font-bold text-white sm:text-4xl">
                Últimas subvenciones
              </h1>
              <p className="mb-1 text-slate-400">
                Las convocatorias más recientes del BDNS — detecta y clasifica
                oportunidades de financiación para tu cartera de clientes.
              </p>
              <p className="mb-8 text-xs text-slate-600">
                {todayES()}
              </p>
              <SearchBar value={searchText} onChange={handleSearchChange} />
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          {/* Error banner */}
          {error && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error.includes("503") || error.includes("initialised")
                ? "Base de datos no inicializada. Ejecuta npm run scrape para poblar los datos."
                : "Error al cargar los datos. Comprueba tu conexión e inténtalo de nuevo."}
            </div>
          )}

          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <FilterPanel filters={filters} onChange={handleFilterChange} />
            <p className="text-sm text-slate-500">
              {loading ? (
                <span className="inline-block h-4 w-24 animate-pulse rounded bg-slate-800" />
              ) : (
                <>
                  {data.totalElements.toLocaleString("es-ES")}{" "}
                  {data.totalElements === 1 ? "resultado" : "resultados"}
                </>
              )}
            </p>
          </div>

          <SubvencionList
            subvenciones={data.content}
            isFavorite={isFavorite}
            onToggleFavorite={toggleFavorite}
            loading={loading}
          />

          <div className="mt-8">
            <Pagination
              currentPage={page}
              totalPages={data.totalPages}
              onPageChange={(p) => {
                setPage(p);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
