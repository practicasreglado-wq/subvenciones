import { ExternalLink } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/50 bg-slate-950 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-slate-500">
            Datos obtenidos de la{" "}
            <a
              href="https://www.subvenciones.gob.es/bdnstrans/GE/es/convocatorias"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300"
            >
              Base de Datos Nacional de Subvenciones (BDNS)
              <ExternalLink className="h-3 w-3" />
            </a>
          </p>
          <p className="text-xs text-slate-600">
            Los datos se actualizan semanalmente. La información mostrada es
            meramente informativa. Consulte la fuente oficial para datos
            actualizados.
          </p>
          <p className="text-xs text-slate-700">
            Reglado Subvenciones &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </footer>
  );
}
