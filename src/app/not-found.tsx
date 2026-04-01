import Link from "next/link";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-center">
      <h1 className="mb-2 text-6xl font-bold text-slate-700">404</h1>
      <h2 className="mb-4 text-xl font-medium text-slate-400">
        Página no encontrada
      </h2>
      <p className="mb-8 text-sm text-slate-600">
        La página que buscas no existe o ha sido movida
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-500"
      >
        <Home className="h-4 w-4" />
        Volver al inicio
      </Link>
    </div>
  );
}
