"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Star, Sparkles, Clock } from "lucide-react";

interface NavbarProps {
  favoritesCount: number;
}

export default function Navbar({ favoritesCount }: NavbarProps) {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/20 group-hover:bg-emerald-500/30">
            <Sparkles className="h-5 w-5 text-emerald-400" />
          </div>
          <span className="text-xl font-bold text-white">Reglado</span>
        </Link>

        <div className="flex items-center gap-1">
          <Link
            href="/"
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
              pathname === "/"
                ? "bg-slate-800 text-white"
                : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
            }`}
          >
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Últimas</span>
          </Link>

          <Link
            href="/todas"
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
              pathname === "/todas"
                ? "bg-slate-800 text-white"
                : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
            }`}
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Todas</span>
          </Link>

          <Link
            href="/favoritos"
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
              pathname === "/favoritos"
                ? "bg-slate-800 text-white"
                : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
            }`}
          >
            <Star className="h-4 w-4" />
            <span className="hidden sm:inline">Favoritos</span>
            {favoritesCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-xs font-bold text-white">
                {favoritesCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
}
