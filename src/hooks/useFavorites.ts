"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "reglado_favorites";

export function useFavorites() {
  const [favorites, setFavorites] = useState<number[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    }
  }, [favorites, loaded]);

  const isFavorite = useCallback(
    (id: number) => favorites.includes(id),
    [favorites]
  );

  const toggleFavorite = useCallback((id: number) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
    );
  }, []);

  return { favorites, isFavorite, toggleFavorite, loaded };
}
