/**
 * build-ultimas.ts
 *
 * Fetches the 10,000 most recent convocatorias from the BDNS API,
 * scrapes their plazo/presupuesto details, and writes the result to
 * src/data/ultimasConvocatorias.json.
 *
 * Usage:
 *   npx tsx scripts/build-ultimas.ts
 *   npx tsx scripts/build-ultimas.ts --force   (re-scrape plazos already done)
 */

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

// ── Config ────────────────────────────────────────────────────────────────────

const BULK_API   = "https://www.subvenciones.gob.es/bdnstrans/api/convocatorias/busqueda";
const DETAIL_API = "https://www.subvenciones.gob.es/bdnstrans/api/convocatorias";
const DB_PATH    = path.resolve(process.cwd(), "data/bdns.db");
const JSON_PATH  = path.resolve(process.cwd(), "src/data/ultimasConvocatorias.json");

const TOTAL_RECORDS = 10_000;
const PAGE_SIZE     = 1_000;
const PAGES         = TOTAL_RECORDS / PAGE_SIZE; // 10

const BULK_DELAY_MS   = 300;
const DETAIL_DELAY_MS = 400;
const BATCH_SIZE      = 50;

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

function fmt(label: string, val: string | number) {
  console.log(`${label.padEnd(30)} ${val}`);
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface BulkRecord {
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

interface BulkResponse {
  content: BulkRecord[];
  totalPages: number;
  last: boolean;
}

interface DetailResponse {
  fechaInicioSolicitud: string | null;
  fechaFinSolicitud:    string | null;
  textInicio:           string | null;
  textFin:              string | null;
  abierto:              boolean | null;
  presupuestoTotal:     number | null;
  tipoConvocatoria:     string | null;
}

// ── Phase 1: fetch bulk list ──────────────────────────────────────────────────

async function fetchPage(page: number): Promise<BulkResponse> {
  const params = new URLSearchParams({
    vpd: "GE", page: String(page), pageSize: String(PAGE_SIZE),
    order: "fechaRecepcion", direccion: "desc",
  });
  const res = await fetch(`${BULK_API}?${params}`, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Bulk API ${res.status} on page ${page}`);
  return res.json();
}

async function fetchAllBulk(db: Database.Database): Promise<string[]> {
  console.log("\n📥  Fase 1 — Descargando 10.000 convocatorias del BDNS…\n");

  const insertConv = db.prepare(`
    INSERT OR REPLACE INTO convocatorias
      (id, mrr, numeroConvocatoria, descripcion, descripcionLeng,
       fechaRecepcion, nivel1, nivel2, nivel3, codigoInvente)
    VALUES (?,?,?,?,?,?,?,?,?,?)
  `);
  const insertFts = db.prepare(
    `INSERT OR REPLACE INTO convocatorias_fts(rowid, descripcion) VALUES (?,?)`
  );

  const insertBatch = db.transaction((rows: BulkRecord[]) => {
    for (const r of rows) {
      insertConv.run(
        r.id, r.mrr ? 1 : 0, r.numeroConvocatoria,
        r.descripcion, r.descripcionLeng ?? null, r.fechaRecepcion,
        r.nivel1, r.nivel2, r.nivel3 ?? null, r.codigoInvente ?? null,
      );
      insertFts.run(r.id, r.descripcion);
    }
  });

  const numConvs: string[] = [];

  for (let p = 0; p < PAGES; p++) {
    const data = await fetchPage(p);
    insertBatch(data.content);
    data.content.forEach((r) => numConvs.push(r.numeroConvocatoria));
    process.stdout.write(`   Página ${p + 1}/${PAGES} — ${numConvs.length} registros\r`);
    if (!data.last && p < PAGES - 1) await sleep(BULK_DELAY_MS);
  }

  console.log(`\n   ✅  ${numConvs.length} convocatorias descargadas e insertadas en DB\n`);
  return numConvs;
}

// ── Phase 2: scrape plazos ────────────────────────────────────────────────────

async function fetchDetail(numConv: string): Promise<DetailResponse | null> {
  const url = `${DETAIL_API}?numConv=${encodeURIComponent(numConv)}&vpd=GE`;
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const json = await res.json();
    const item = Array.isArray(json) ? json[0] : json;
    if (!item) return null;
    return {
      fechaInicioSolicitud: item.fechaInicioSolicitud ?? null,
      fechaFinSolicitud:    item.fechaFinSolicitud    ?? null,
      textInicio:           item.textInicio           ?? null,
      textFin:              item.textFin              ?? null,
      abierto:              item.abierto              ?? null,
      presupuestoTotal:     item.presupuestoTotal      ?? null,
      tipoConvocatoria:     item.tipoConvocatoria      ?? null,
    };
  } catch {
    return null;
  }
}

function toISODate(raw: string | null): string | null {
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const m = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return null;
}

async function scrapePlazos(db: Database.Database, numConvs: string[], force: boolean) {
  const forceClause = force ? "" : "AND plazoScrapedAt IS NULL";
  const ph = numConvs.map(() => "?").join(",");

  const pending = db.prepare(
    `SELECT id, numeroConvocatoria FROM convocatorias
     WHERE numeroConvocatoria IN (${ph}) ${forceClause}
     ORDER BY fechaRecepcion DESC`
  ).all(...numConvs) as { id: number; numeroConvocatoria: string }[];

  console.log(`\n🔍  Fase 2 — Scrapeando plazos de ${pending.length} convocatorias…`);
  if (pending.length === 0) { console.log("   ✅  Todas ya tienen plazo.\n"); return; }

  const updateStmt = db.prepare(`
    UPDATE convocatorias SET
      plazoInicio = ?, plazoFin = ?, fechaFinSolicitud = ?,
      textInicio = ?, textFin = ?, abierto = ?,
      presupuestoTotal = ?, tipoConvocatoria = ?, plazoScrapedAt = datetime('now')
    WHERE id = ?
  `);

  const commitBatch = db.transaction((rows: Parameters<typeof updateStmt.run>[]) => {
    for (const r of rows) updateStmt.run(...r);
  });

  let exactDates = 0, textOnly = 0;
  const batch: Parameters<typeof updateStmt.run>[] = [];
  const start = Date.now();

  for (let i = 0; i < pending.length; i++) {
    const { id, numeroConvocatoria } = pending[i];
    const detail = await fetchDetail(numeroConvocatoria);

    const fechaFin    = toISODate(detail?.fechaFinSolicitud ?? null);
    const fechaInicio = toISODate(detail?.fechaInicioSolicitud ?? null);
    const textFin     = detail?.textFin ?? null;
    const plazoFin    = fechaFin ?? textFin;
    const plazoInicio = fechaInicio ?? detail?.textInicio ?? null;
    if (fechaFin) exactDates++; else textOnly++;

    batch.push([
      plazoInicio, plazoFin, fechaFin,
      detail?.textInicio ?? null, textFin,
      detail?.abierto != null ? (detail.abierto ? 1 : 0) : null,
      detail?.presupuestoTotal ?? null,
      detail?.tipoConvocatoria ?? null,
      id,
    ]);

    if (batch.length >= BATCH_SIZE || i === pending.length - 1) {
      commitBatch(batch.splice(0));
    }

    if ((i + 1) % 10 === 0 || i === pending.length - 1) {
      const elapsed = Math.round((Date.now() - start) / 1000);
      const rate = (i + 1) / elapsed;
      const eta = Math.round((pending.length - i - 1) / rate);
      process.stdout.write(
        `   📥  ${i + 1}/${pending.length} (${Math.round(((i+1)/pending.length)*100)}%) | ` +
        `fecha exacta: ${exactDates} | solo texto: ${textOnly} | ${elapsed}s | ETA ~${eta}s   \r`
      );
    }

    await sleep(DETAIL_DELAY_MS);
  }

  console.log(`\n   ✅  Plazos scrapeados — fecha exacta: ${exactDates} | solo texto: ${textOnly}\n`);
}

// ── Phase 3: export JSON ──────────────────────────────────────────────────────

function exportJson(db: Database.Database, numConvs: string[]) {
  console.log("📤  Fase 3 — Exportando JSON…");
  const ph = numConvs.map(() => "?").join(",");

  const rows = db.prepare(`
    SELECT id, mrr, numeroConvocatoria, descripcion, descripcionLeng,
           fechaRecepcion, nivel1, nivel2, nivel3, codigoInvente,
           plazoInicio, plazoFin, fechaFinSolicitud, textInicio, textFin,
           abierto, presupuestoTotal, tipoConvocatoria
    FROM convocatorias
    WHERE numeroConvocatoria IN (${ph})
    ORDER BY fechaRecepcion DESC
  `).all(...numConvs) as Record<string, unknown>[];

  const output = rows.map((r) => ({
    ...r,
    mrr:    r.mrr    === 1,
    abierto: r.abierto == null ? null : r.abierto === 1,
  }));

  fs.writeFileSync(JSON_PATH, JSON.stringify(output, null, 2), "utf8");
  const sizeKB = Math.round(fs.statSync(JSON_PATH).size / 1024);
  console.log(`   ✅  ${output.length} registros → ${JSON_PATH} (${sizeKB} KB)\n`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const force = process.argv.includes("--force");

  console.log("━".repeat(50));
  console.log("  Reglado — build-ultimas");
  console.log("━".repeat(50));
  fmt("📋  Registros a descargar:", TOTAL_RECORDS);
  fmt("🔁  Forzar re-scrape plazos:", force ? "SÍ" : "NO");
  console.log();

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  const numConvs = await fetchAllBulk(db);
  await scrapePlazos(db, numConvs, force);
  exportJson(db, numConvs);

  db.close();
  console.log("🎉  ¡Listo!");
}

main().catch((e) => { console.error(e); process.exit(1); });
