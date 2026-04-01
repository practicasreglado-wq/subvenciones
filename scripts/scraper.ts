/**
 * Reglado Subvenciones - Scraper
 *
 * Fetches ALL convocatorias from the BDNS public API and stores them in SQLite.
 * Legal open government data (datos.gob.es / subvenciones.gob.es).
 *
 * Usage:
 *   npx tsx scripts/scraper.ts            → fetch all (~620k records)
 *   npx tsx scripts/scraper.ts --resume   → resume from last saved page
 */

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const API_URL =
  "https://www.subvenciones.gob.es/bdnstrans/api/convocatorias/busqueda";
const PAGE_SIZE = 1000;
const DELAY_MS = 300;
const DB_PATH = path.resolve(process.cwd(), "data/bdns.db");

interface Subvencion {
  id: number;
  mrr: boolean;
  numeroConvocatoria: string;
  descripcion: string;
  descripcionLeng: string | null;
  fechaRecepcion: string;
  nivel1: string;
  nivel2: string;
  nivel3: string | null;
  codigoInvente: string | null;
}

interface ApiResponse {
  content: Subvencion[];
  totalElements: number;
  totalPages: number;
  number: number;
  last: boolean;
}

// --- helpers -----------------------------------------------------------------

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

async function fetchPage(page: number): Promise<ApiResponse> {
  const params = new URLSearchParams({
    vpd: "GE",
    page: String(page),
    pageSize: String(PAGE_SIZE),
    order: "fechaRecepcion",
    direccion: "desc",
  });

  const res = await fetch(`${API_URL}?${params}`, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) throw new Error(`HTTP ${res.status} on page ${page}`);
  return res.json() as Promise<ApiResponse>;
}

// --- database ----------------------------------------------------------------

function openDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS convocatorias (
      id                  INTEGER PRIMARY KEY,
      mrr                 INTEGER NOT NULL DEFAULT 0,
      numeroConvocatoria  TEXT    NOT NULL,
      descripcion         TEXT    NOT NULL,
      descripcionLeng     TEXT,
      fechaRecepcion      TEXT    NOT NULL,
      nivel1              TEXT    NOT NULL,
      nivel2              TEXT    NOT NULL,
      nivel3              TEXT,
      codigoInvente       TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_fecha   ON convocatorias(fechaRecepcion DESC);
    CREATE INDEX IF NOT EXISTS idx_nivel1  ON convocatorias(nivel1);
    CREATE INDEX IF NOT EXISTS idx_nivel2  ON convocatorias(nivel2);

    -- FTS for full-text search on description
    CREATE VIRTUAL TABLE IF NOT EXISTS convocatorias_fts USING fts5(
      descripcion,
      descripcionLeng,
      nivel2,
      nivel3,
      content='convocatorias',
      content_rowid='id'
    );

    CREATE TABLE IF NOT EXISTS scraper_state (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  return db;
}

function getLastPage(db: Database.Database): number {
  const row = db
    .prepare("SELECT value FROM scraper_state WHERE key = 'last_page'")
    .get() as { value: string } | undefined;
  return row ? parseInt(row.value, 10) : -1;
}

function saveState(db: Database.Database, page: number, total: number) {
  db.prepare(
    "INSERT OR REPLACE INTO scraper_state(key,value) VALUES(?,?)"
  ).run("last_page", String(page));
  db.prepare(
    "INSERT OR REPLACE INTO scraper_state(key,value) VALUES(?,?)"
  ).run("total_elements", String(total));
}

function upsertBatch(db: Database.Database, items: Subvencion[]) {
  const insert = db.prepare(`
    INSERT OR REPLACE INTO convocatorias
      (id, mrr, numeroConvocatoria, descripcion, descripcionLeng,
       fechaRecepcion, nivel1, nivel2, nivel3, codigoInvente)
    VALUES
      (@id, @mrr, @numeroConvocatoria, @descripcion, @descripcionLeng,
       @fechaRecepcion, @nivel1, @nivel2, @nivel3, @codigoInvente)
  `);

  const insertFts = db.prepare(`
    INSERT OR REPLACE INTO convocatorias_fts
      (rowid, descripcion, descripcionLeng, nivel2, nivel3)
    VALUES
      (@id, @descripcion, @descripcionLeng, @nivel2, @nivel3)
  `);

  const txn = db.transaction((rows: Subvencion[]) => {
    for (const row of rows) {
      insert.run({ ...row, mrr: row.mrr ? 1 : 0 });
      insertFts.run({
        id: row.id,
        descripcion: row.descripcion,
        descripcionLeng: row.descripcionLeng ?? "",
        nivel2: row.nivel2,
        nivel3: row.nivel3 ?? "",
      });
    }
  });

  txn(items);
}

// --- main --------------------------------------------------------------------

async function main() {
  const resume = process.argv.includes("--resume");

  console.log(`\n🔍  Reglado Subvenciones — Scraper`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📁  DB: ${DB_PATH}`);
  console.log(`📄  Page size: ${PAGE_SIZE}`);
  console.log(`⏱️   Delay: ${DELAY_MS}ms between requests\n`);

  const db = openDb();
  let startPage = 0;

  if (resume) {
    const last = getLastPage(db);
    if (last >= 0) {
      startPage = last + 1;
      const saved = (
        db
          .prepare("SELECT COUNT(*) as n FROM convocatorias")
          .get() as { n: number }
      ).n;
      console.log(`▶️  Resuming from page ${startPage} (${saved.toLocaleString()} already saved)\n`);
    }
  } else {
    // Fresh run: wipe tables
    db.exec(`
      DELETE FROM convocatorias;
      DELETE FROM convocatorias_fts;
      DELETE FROM scraper_state;
    `);
    console.log(`🗑️  Cleared existing data for fresh run\n`);
  }

  // --- first request: discover totals
  let totalPages = 1;
  let totalElements = 0;

  try {
    const first = await fetchPage(startPage);
    totalPages = first.totalPages;
    totalElements = first.totalElements;

    console.log(`📊  Total records in BDNS: ${totalElements.toLocaleString()}`);
    console.log(`📄  Total pages to fetch:  ${totalPages.toLocaleString()}`);
    console.log(`⏳  Estimated time:        ~${Math.ceil((totalPages - startPage) * DELAY_MS / 60000)} min\n`);

    upsertBatch(db, first.content);
    saveState(db, startPage, totalElements);
    startPage += 1;
  } catch (err) {
    console.error("❌  Failed on first request:", err);
    process.exit(1);
  }

  // --- paginate
  let errors = 0;
  const startTime = Date.now();

  for (let page = startPage; page < totalPages; page++) {
    try {
      await sleep(DELAY_MS);
      const data = await fetchPage(page);
      upsertBatch(db, data.content);
      saveState(db, page, totalElements);

      if (data.last) break;
    } catch (err) {
      errors++;
      console.error(`\n⚠️  Error on page ${page}: ${err}. Retrying in 3s...`);
      await sleep(3000);
      page--; // retry same page
      if (errors > 10) {
        console.error("❌  Too many errors. Aborting. Run with --resume to continue.");
        break;
      }
      continue;
    }

    // progress every 10 pages
    if (page % 10 === 0) {
      const saved = (
        db.prepare("SELECT COUNT(*) as n FROM convocatorias").get() as { n: number }
      ).n;
      const pct = ((page / totalPages) * 100).toFixed(1);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      process.stdout.write(
        `\r📥  Page ${page.toLocaleString()}/${totalPages.toLocaleString()} | ${saved.toLocaleString()} records | ${pct}% | ${elapsed}s elapsed   `
      );
      errors = 0; // reset error streak
    }
  }

  const finalCount = (
    db.prepare("SELECT COUNT(*) as n FROM convocatorias").get() as { n: number }
  ).n;

  console.log(`\n\n✅  Done!`);
  console.log(`📊  Total records saved: ${finalCount.toLocaleString()}`);
  console.log(`📁  Database: ${DB_PATH}`);
  console.log(`⏱️   Total time: ${((Date.now() - startTime) / 1000 / 60).toFixed(1)} min\n`);

  db.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
