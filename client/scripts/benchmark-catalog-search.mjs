#!/usr/bin/env node
/**
 * Benchmark qualità ricerca catalogo (Arfly via BFF).
 *
 * Uso:
 *   node client/scripts/benchmark-catalog-search.mjs
 *   API_BASE=http://localhost:4000 node client/scripts/benchmark-catalog-search.mjs --locale IT
 *
 * Output: report JSON in stdout + file opzionale con --out report.json
 */

const API_BASE = process.env.API_BASE ?? 'http://localhost:4000'
const LOCALE = process.argv.includes('--locale')
  ? process.argv[process.argv.indexOf('--locale') + 1]
  : 'IT'

const REQUEST_DELAY_MS = Number(process.env.BENCHMARK_DELAY_MS ?? 1100)

const BENCHMARK_QUERIES = [
  'GU10',
  'E27',
  'E14',
  'led',
  'faretto',
  'osram',
  'philips',
  'sospensione',
  'applique',
  'plafoniera',
  'mr16',
  'alogeno',
  'fluorescente',
  'alimentatore',
  'tubo t8',
  '2700k',
  '3000k',
  'dimmer',
  'incasso',
  'esterno',
  'ip65',
  'cucina',
  'bagno',
  'soggiorno',
  'camera',
  'flos',
  'artemide',
  'foscarini',
  'linea light',
  'panzeri',
  'vite grande',
  'baionetta',
  'capsula g9',
  'r7s',
  'gx53',
  't5',
  'strip led',
  'proiettore',
  'binario',
  'fareto',
  'osrm',
  'philps',
  'sospension',
  'alogen',
  'alimentator',
  'tubo led',
  'incaso',
  'esterno ip',
  'dimable',
  'sospensione vetro',
]

async function searchProducts(query) {
  const url = new URL('/api/v1/catalog/products', API_BASE)
  url.searchParams.set('q', query)
  url.searchParams.set('page', '1')
  url.searchParams.set('pageSize', '6')
  url.searchParams.set('locale', LOCALE)

  const started = performance.now()
  const response = await fetch(url, { headers: { Accept: 'application/json' } })
  const elapsedMs = Math.round(performance.now() - started)

  if (!response.ok) {
    return {
      query,
      ok: false,
      status: response.status,
      total: 0,
      items: 0,
      elapsedMs,
      error: await response.text(),
    }
  }

  const body = await response.json()
  const payload = body?.data && typeof body.data === 'object' ? body.data : body
  const items = Array.isArray(payload.items) ? payload.items : []

  return {
    query,
    ok: true,
    status: response.status,
    total: payload.total ?? items.length,
    items: items.length,
    elapsedMs,
    topHit: items[0]?.name ?? null,
  }
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  const results = []
  for (const [index, query] of BENCHMARK_QUERIES.entries()) {
    if (index > 0 && REQUEST_DELAY_MS > 0) await sleep(REQUEST_DELAY_MS)
    try {
      results.push(await searchProducts(query))
    } catch (error) {
      results.push({
        query,
        ok: false,
        status: 0,
        total: 0,
        items: 0,
        elapsedMs: 0,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  const successful = results.filter((row) => row.ok)
  const zeroResults = successful.filter((row) => row.total === 0)
  const typoQueries = ['fareto', 'osrm', 'philps', 'sospension', 'alogen', 'incaso', 'dimable']
  const typoResults = successful.filter((row) => typoQueries.includes(row.query))
  const typoZero = typoResults.filter((row) => row.total === 0)

  const report = {
    generatedAt: new Date().toISOString(),
    apiBase: API_BASE,
    locale: LOCALE,
    queryCount: BENCHMARK_QUERIES.length,
    successCount: successful.length,
    zeroResultCount: zeroResults.length,
    zeroResultRate: successful.length ? zeroResults.length / successful.length : 1,
    typoQueryCount: typoQueries.length,
    typoZeroCount: typoZero.length,
    typoZeroRate: typoResults.length ? typoZero.length / typoResults.length : 1,
    avgElapsedMs: successful.length
      ? Math.round(successful.reduce((sum, row) => sum + row.elapsedMs, 0) / successful.length)
      : 0,
    algoliaGoNoGo: {
      recommendAlgolia:
        zeroResults.length / Math.max(successful.length, 1) > 0.2 ||
        typoZero.length / Math.max(typoResults.length, 1) > 0.5,
      rationale:
        'Se zeroResultRate > 20% o typoZeroRate > 50%, valutare Fase 2 Algolia autocomplete-only.',
    },
    results,
  }

  const outIndex = process.argv.indexOf('--out')
  const outPath = outIndex >= 0 ? process.argv[outIndex + 1] : null
  const json = JSON.stringify(report, null, 2)
  console.log(json)

  if (outPath) {
    const { writeFile } = await import('node:fs/promises')
    await writeFile(outPath, json)
    console.error(`Report scritto in ${outPath}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
