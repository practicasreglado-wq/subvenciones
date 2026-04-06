"use client";

import { useState, useEffect } from "react";
import { Star, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SubvencionList from "@/components/SubvencionList";
import EmailModal from "@/components/EmailModal";
import { useFavorites } from "@/hooks/useFavorites";
import { Subvencion } from "@/lib/types";

export default function FavoritosPage() {
  const { favorites, isFavorite, toggleFavorite, loaded } = useFavorites();
  const [favoriteItems, setFavoriteItems] = useState<Subvencion[]>([]);
  const [fetching, setFetching] = useState(false);
  const [emailSub, setEmailSub] = useState<Subvencion | null>(null);

  useEffect(() => {
    if (!loaded || favorites.length === 0) {
      setFavoriteItems([]);
      return;
    }

    setFetching(true);

    Promise.all(
      favorites.map((id) =>
        fetch(`/api/subvenciones/${id}`)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
      )
    ).then((results) => {
      setFavoriteItems(results.filter(Boolean) as Subvencion[]);
      setFetching(false);
    });
  }, [loaded, favorites]);

  return (
    <>
      <Navbar favoritesCount={favorites.length} />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="mb-8">
            <Link
              href="/"
              className="mb-4 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al buscador
            </Link>
            <div className="flex items-center gap-3">
              <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
              <h1 className="text-2xl font-bold text-white">Mis Favoritos</h1>
              {favorites.length > 0 && (
                <span className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-400">
                  {favorites.length}
                </span>
              )}
            </div>
          </div>

          {!loaded || fetching ? (
            <SubvencionList
              subvenciones={[]}
              isFavorite={isFavorite}
              onToggleFavorite={toggleFavorite}
              loading
            />
          ) : favorites.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Star className="mb-4 h-12 w-12 text-slate-700" />
              <h3 className="mb-2 text-lg font-medium text-slate-400">
                No tienes favoritos guardados
              </h3>
              <p className="mb-6 text-sm text-slate-600">
                Marca subvenciones con la estrella para guardarlas aquí
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-500"
              >
                Buscar subvenciones
              </Link>
            </div>
          ) : (
            <SubvencionList
              subvenciones={favoriteItems}
              isFavorite={isFavorite}
              onToggleFavorite={toggleFavorite}
              onGenerarEmail={setEmailSub}
            />
          )}
        </div>
      </main>

      <Footer />

      {emailSub && (
        <EmailModal
          subvencion={emailSub}
          onClose={() => setEmailSub(null)}
        />
      )}
    </>
  );
}
