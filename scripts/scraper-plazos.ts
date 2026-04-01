/**
 * Reglado Subvenciones — Scraper de Plazos (JSON API)
 *
 * Calls the BDNS detail JSON API for each recent convocatoria to fetch:
 *   - fechaInicioSolicitud  (ISO date | null)
 *   - fechaFinSolicitud     (ISO date | null)
 *   - textInicio            (free text describing start date)
 *   - textFin               (free text describing deadline, e.g. "UN MES")
 *   - abierto               (boolean — is it currently open?)
 *   - presupuestoTotal      (budget in EUR)
 *   - tipoConvocatoria      (grant type)
 *
 * Only processes recent convocatorias (default: last 30 days) that haven't
 * been scraped yet. Safe to run every week — skips already-scraped ones.
 *
 * Usage:
 *   npx tsx scripts/scraper-plazos.ts              → last 30 days, skip done
 *   npx tsx scripts/scraper-plazos.ts --days=60    → last 60 days
 *   npx tsx scripts/scraper-plazos.ts --force      → re-scrape all
 *   npx tsx scripts/scraper-plazos.ts --limit=100  → cap at 100
 *
 * npm scripts:
 *   npm run scrape:plazos         → normal weekly run
 *   npm run scrape:plazos:force   → force re-scrape
 */

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// ─── Config ──────────────────────────────────────────────────────────────────

const DETAIL_API  = "https://www.subvenciones.gob.es/bdnstrans/api/convocatorias";
const DB_PATH     = path.resolve(process.cwd(), "data/bdns.db");
const DELAY_MS    = 400;   // ms between requests (polite)
const BATCH_SIZE  = 50;    // rows per DB transaction

// ─── Types ───────────────────────────────────────────────────────────────────

interface DetailResponse {
  fechaInicioSolicitud: string | null;
  fechaFinSolicitud: string | null;
  textInicio: string | null;
  textFin: string | null;
  abierto: boolean | null;
  presupuestoTotal: number | null;
  tipoConvocatoria: string | null;
}

// ─── CLI args ─────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  let days  = 30;
  let force = false;
  let limit = Infinity;

  for (const a of args) {
    if (a.startsWith("--days="))  days  = parseInt(a.split("=")[1], 10);
    if (a === "--force")          force = true;
    if (a.startsWith("--limit=")) limit = parseInt(a.split("=")[1], 10);
  }
  return { days, force, limit };
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

// ─── Fetch detail ────────────────────────────────────────────────────────────

async function fetchDetail(numConv: string): Promise<DetailResponse | null> {
  const url = `${DETAIL_API}?numConv=${encodeURIComponent(numConv)}&vpd=GE`;
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; Reglado/1.0)",
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (res.status === 404) return null;
    if (!res.ok) {
      console.error(`  HTTP ${res.status} for ${numConv}`);
      return null;
    }

    const data = await res.json();
    return {
      fechaInicioSolicitud: data.fechaInicioSolicitud ?? null,
      fechaFinSolicitud:    data.fechaFinSolicitud    ?? null,
      textInicio:           data.textInicio?.trim()   ?? null,
      textFin:              data.textFin?.trim()       ?? null,
      abierto:              data.abierto               ?? null,
      presupuestoTotal:     data.presupuestoTotal      ?? null,
      tipoConvocatoria:     data.tipoConvocatoria?.trim() ?? null,
    };
  } catch (err) {
    console.error(`  Error fetching ${numConv}:`, (err as Error).message);
    return null;
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const { days, force, limit } = parseArgs();
  const since = daysAgo(days);

  console.log(`\n⏱️   Reglado — Scraper de Plazos`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📅  Convocatorias desde: ${since} (últimos ${days} días)`);
  console.log(`🔁  Forzar re-scrape:   ${force ? "SÍ" : "NO (solo pendientes)"}`);
  if (limit !== Infinity) console.log(`🔢  Límite:             ${limit}`);
  console.log();

  if (!fs.existsSync(DB_PATH)) {
    console.error("❌  DB no encontrada. Ejecuta primero: npm run scrape");
    process.exit(1);
  }

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  // Idempotent migration — add columns if missing
  const newCols: Record<string, string> = {
    plazoInicio:      "TEXT",
    plazoFin:         "TEXT",
    plazoScrapedAt:   "TEXT",
    fechaFinSolicitud:"TEXT",
    textInicio:       "TEXT",
    textFin:          "TEXT",
    abierto:          "INTEGER",
    presupuestoTotal: "REAL",
    tipoConvocatoria: "TEXT",
  };
  for (const [col, type] of Object.entries(newCols)) {
    try { db.exec(`ALTER TABLE convocatorias ADD COLUMN ${col} ${type}`); }
    catch { /* already exists */ }
  }

  // ─── Select targets ────────────────────────────────────────────────────────
  const whereExtra = force ? "" : "AND plazoScrapedAt IS NULL";
  const rows = db
    .prepare(`
      SELECT id, numeroConvocatoria, fechaRecepcion
      FROM   convocatorias
      WHERE  fechaRecepcion >= ?
      ${whereExtra}
      ORDER  BY fechaRecepcion DESC
      LIMIT  ?
    `)
    .all(since, limit === Infinity ? 999_999 : limit) as {
      id: number;
      numeroConvocatoria: string;
      fechaRecepcion: string;
    }[];

  if (rows.length === 0) {
    console.log("✅  Nada que hacer. Todas ya tienen plazo o no hay en el rango.");
    db.close();
    return;
  }

  console.log(`📋  Convocatorias a procesar: ${rows.length.toLocaleString("es-ES")}\n`);

  // ─── Prepared statements ───────────────────────────────────────────────────
  const updateStmt = db.prepare(`
    UPDATE convocatorias SET
      plazoInicio       = @plazoInicio,
      plazoFin          = @plazoFin,
      plazoScrapedAt    = @plazoScrapedAt,
      fechaFinSolicitud = @fechaFinSolicitud,
      textInicio        = @textInicio,
      textFin           = @textFin,
      abierto           = @abierto,
      presupuestoTotal  = @presupuestoTotal,
      tipoConvocatoria  = @tipoConvocatoria
    WHERE id = @id
  `);

  type BatchRow = Parameters<typeof updateStmt.run>[0];
  const batchUpdate = db.transaction((items: BatchRow[]) => {
    for (const item of items) updateStmt.run(item);
  });

  // ─── Main loop ─────────────────────────────────────────────────────────────
  let done = 0;
  let withExactDate = 0;
  let withTextOnly  = 0;
  let notFound      = 0;
  let errors        = 0;
  let batch: BatchRow[] = [];
  const startTime = Date.now();

  for (const row of rows) {
    await sleep(DELAY_MS);

    const detail = await fetchDetail(row.numeroConvocatoria);
    const now    = new Date().toISOString();

    if (!detail) {
      notFound++;
      batch.push({
        id: row.id,
        plazoInicio: null, plazoFin: null, plazoScrapedAt: now,
        fechaFinSolicitud: null, textInicio: null, textFin: null,
        abierto: null, presupuestoTotal: null, tipoConvocatoria: null,
      });
    } else {
      // plazoFin = ISO date if available, else the free-text description
      const plazoFin = detail.fechaFinSolicitud ?? detail.textFin ?? null;
      const plazoInicio = detail.fechaInicioSolicitud ?? detail.textInicio ?? null;

      if (detail.fechaFinSolicitud) withExactDate++;
      else if (detail.textFin)      withTextOnly++;

      batch.push({
        id: row.id,
        plazoInicio,
        plazoFin,
        plazoScrapedAt:    now,
        fechaFinSolicitud: detail.fechaFinSolicitud,
        textInicio:        detail.textInicio,
        textFin:           detail.textFin,
        abierto:           detail.abierto ? 1 : 0,
        presupuestoTotal:  detail.presupuestoTotal,
        tipoConvocatoria:  detail.tipoConvocatoria,
      });
    }

    done++;

    if (batch.length >= BATCH_SIZE) {
      batchUpdate(batch);
      batch = [];
    }

    if (done % 10 === 0 || done === rows.length) {
      const pct     = ((done / rows.length) * 100).toFixed(1);
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      const eta     = done < rows.length
        ? Math.ceil(((Date.now() - startTime) / done) * (rows.length - done) / 1000)
        : 0;
      process.stdout.write(
        `\r📥  ${done}/${rows.length} (${pct}%) | fecha exacta: ${withExactDate} | solo texto: ${withTextOnly} | ${elapsed}s${eta > 0 ? ` | ETA ~${eta}s` : ""}   `
      );
    }
  }

  // Flush remaining
  if (batch.length > 0) batchUpdate(batch);

  const elapsed = ((Date.now() - startTime) / 60_000).toFixed(1);

  console.log(`\n\n✅  Scraping de plazos completado`);
  console.log(`📊  Procesadas:         ${done.toLocaleString("es-ES")}`);
  console.log(`📅  Con fecha exacta:   ${withExactDate.toLocaleString("es-ES")}`);
  console.log(`📝  Solo texto (aprox): ${withTextOnly.toLocaleString("es-ES")}`);
  console.log(`🔍  No encontradas:     ${notFound}`);
  console.log(`❌  Errores:            ${errors}`);
  console.log(`⏱️   Tiempo total:       ${elapsed} min`);
  console.log(`\n💡  Ejecuta cada semana con: npm run scrape:plazos\n`);

  db.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
