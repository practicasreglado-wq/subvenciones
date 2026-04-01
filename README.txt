====================================================
  REGLADO SUBVENCIONES
  Buscador de convocatorias del BDNS
====================================================

Aplicacion web para buscar y filtrar subvenciones publicas
espanolas directamente desde la Base de Datos Nacional de
Subvenciones (BDNS) de subvenciones.gob.es.


----------------------------------------------------
STACK
----------------------------------------------------
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS (tema oscuro)
- SQLite via better-sqlite3 + FTS5
- Node.js 20+


----------------------------------------------------
REQUISITOS
----------------------------------------------------
- Node.js 20 o superior
- npm 10 o superior


----------------------------------------------------
INSTALACION
----------------------------------------------------

1. Instalar dependencias:

   npm install

2. Poblar la base de datos (primera vez):

   npm run scrape

   Descarga todas las convocatorias del BDNS (~620 peticiones,
   puede tardar 10-15 min). Crea data/bdns.db (~135 MB).

3. Arrancar el servidor de desarrollo:

   npm run dev

   Abre http://localhost:3000


----------------------------------------------------
SCRAPER DE PLAZOS (semanal)
----------------------------------------------------

Enriquece las convocatorias recientes con datos de plazo,
presupuesto y estado (abierta/cerrada):

   npm run scrape:plazos          -- ultimos 30 dias (recomendado)
   npm run scrape:plazos:force    -- forzar re-scrape de todos
   npx tsx scripts/scraper-plazos.ts --days=60   -- ultimos 60 dias
   npx tsx scripts/scraper-plazos.ts --limit=100 -- solo 100 registros

Ejecutar una vez a la semana. Es idempotente: omite
convocatorias que ya tienen datos.


----------------------------------------------------
SCRIPTS DISPONIBLES
----------------------------------------------------

  npm run dev              Servidor de desarrollo (puerto 3000)
  npm run build            Build de produccion
  npm run start            Servidor de produccion
  npm run lint             ESLint
  npm run scrape           Scraper completo del BDNS
  npm run scrape:resume    Reanudar scraper desde ultima pagina
  npm run scrape:plazos    Scraper de plazos semanal
  npm run scrape:plazos:force  Forzar re-scrape de plazos


----------------------------------------------------
ESTRUCTURA DEL PROYECTO
----------------------------------------------------

  scripts/
    scraper.ts             Scraper bulk (todas las convocatorias)
    scraper-plazos.ts      Scraper de plazos individuales

  src/
    app/
      page.tsx             Pagina principal (buscador)
      favoritos/page.tsx   Pagina de favoritos
      api/subvenciones/    API routes (busqueda + detalle)
    components/
      SubvencionCard.tsx   Tarjeta de convocatoria
      FilterPanel.tsx      Filtros (nivel, region, fecha, abierta)
      SearchBar.tsx        Barra de busqueda
      Pagination.tsx       Paginacion
      Navbar.tsx / Footer.tsx
    hooks/
      useSubvenciones.ts   Hook de busqueda con AbortController
      useFavorites.ts      Favoritos en localStorage
      useDebounce.ts       Debounce 400ms para el buscador
    lib/
      db.ts                Singleton SQLite (solo lectura)
      api.ts               Cliente HTTP para la API
      types.ts             Interfaces TypeScript
      utils.ts             Helpers (formateo, colores, etc.)

  data/
    bdns.db                Base de datos SQLite (generada, no en git)


----------------------------------------------------
FUNCIONALIDADES
----------------------------------------------------

- Busqueda de texto completo (FTS5) sobre todas las convocatorias
- Filtros: nivel administrativo, comunidad autonoma, rango de fechas
- Filtro rapido "Solo abiertas"
- Presets de fecha: Hoy / Esta semana / Este mes
- Plazo con codigo de colores:
    Verde    mas de 30 dias
    Ambar    menos de 30 dias
    Rojo     menos de 7 dias (urgente)
    Tachado  plazo vencido
- Favoritos guardados en localStorage (sin registro)
- Enlace directo a la convocatoria oficial en subvenciones.gob.es
- Badge MRR para convocatorias en regimen de minimos
- Presupuesto formateado en K€ / M€


----------------------------------------------------
BASE DE DATOS
----------------------------------------------------

El archivo data/bdns.db no se incluye en el repositorio
(esta en .gitignore por su tamano ~135 MB). Hay que generarlo
con: npm run scrape

Tablas:
  convocatorias      Datos principales de cada convocatoria
  convocatorias_fts  Indice FTS5 para busqueda de texto completo
  scraper_state      Estado del scraper bulk (para --resume)


----------------------------------------------------
DESPLIEGUE EN VPS (Hostinger)
----------------------------------------------------

1. npm run build
2. Configurar next.config.mjs con output: 'standalone'
3. Gestionar proceso con PM2:
     pm2 start npm --name reglado -- start
4. Nginx como proxy inverso al puerto 3000
5. Certbot para HTTPS
6. Cron semanal para npm run scrape:plazos


----------------------------------------------------
FUENTE DE DATOS
----------------------------------------------------

Base de Datos Nacional de Subvenciones (BDNS)
Ministerio de Hacienda - Gobierno de Espana
https://www.subvenciones.gob.es

API utilizada:
  GET /bdnstrans/api/convocatorias/busqueda  (listado bulk)
  GET /bdnstrans/api/convocatorias           (detalle por numConv)

Uso exclusivamente informativo y no comercial.


====================================================
