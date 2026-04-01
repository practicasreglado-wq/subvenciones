"use client";

import { Star } from "lucide-react";

interface FavoriteStarProps {
  active: boolean;
  onClick: () => void;
}

export default function FavoriteStar({ active, onClick }: FavoriteStarProps) {
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className={`rounded-lg p-2 ${
        active
          ? "text-yellow-400 hover:text-yellow-300"
          : "text-slate-600 hover:text-yellow-400"
      }`}
      aria-label={active ? "Quitar de favoritos" : "Añadir a favoritos"}
    >
      <Star className={`h-5 w-5 ${active ? "fill-current" : ""}`} />
    </button>
  );
}
