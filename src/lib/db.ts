import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.resolve(process.cwd(), "data/bdns.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  if (!fs.existsSync(DB_PATH)) {
    throw new Error(
      `Database not found at ${DB_PATH}. Run 'npm run scrape' first.`
    );
  }

  _db = new Database(DB_PATH, { readonly: true });
  _db.pragma("journal_mode = WAL");
  return _db;
}

export interface DbConvocatoria {
  id: number;
  mrr: number;
  numeroConvocatoria: string;
  descripcion: string;
  descripcionLeng: string | null;
  fechaRecepcion: string;
  nivel1: string;
  nivel2: string;
  nivel3: string | null;
  codigoInvente: string | null;
  plazoInicio: string | null;
  plazoFin: string | null;
  plazoScrapedAt: string | null;
  fechaFinSolicitud: string | null;
  textInicio: string | null;
  textFin: string | null;
  abierto: number | null;   // SQLite INTEGER: 1=true, 0=false, null=unknown
  presupuestoTotal: number | null;
  tipoConvocatoria: string | null;
}
