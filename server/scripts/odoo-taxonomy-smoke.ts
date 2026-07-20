/**
 * Smoke live Odoo — tassonomie R1 (ambiente) / R2 (tipologia, stile) / paradigma category.
 * Uso: cd server && npx tsx scripts/odoo-taxonomy-smoke.ts
 */
import 'dotenv/config'
import { config as loadDotenv } from 'dotenv'
import { resolve } from 'node:path'

loadDotenv({ path: resolve(process.cwd(), '../.env') })
loadDotenv({ path: resolve(process.cwd(), '.env') })

const base = (process.env.ODOO_CATALOG_BASE_URL ?? '').replace(/\/$/, '')
const key = process.env.ODOO_CATALOG_API_KEY?.trim() || process.env.ODOO_API_KEY?.trim() || ''
const website = process.env.ODOO_WEBSITE_ID || '2'

async function getJson(path: string, params: Record<string, string> = {}) {
  const url = new URL(`${base}${path}`)
  url.searchParams.set('website', String(website))
  url.searchParams.set('lang', 'it_IT')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' },
    signal: AbortSignal.timeout(25_000),
  })
  const text = await res.text()
  let body: unknown
  try {
    body = JSON.parse(text)
  } catch {
    body = text
  }
  if (!res.ok) throw new Error(`${res.status} ${url}\n${text.slice(0, 400)}`)
  return body as Record<string, unknown>
}

async function main() {
  if (!base || !key) {
    console.error('Missing ODOO_CATALOG_BASE_URL / ODOO_CATALOG_API_KEY')
    process.exit(1)
  }
  console.log('Base', base)

  const rooms = ['soggiorno', 'cucina', 'bagno', 'camera', 'studio', 'esterno']
  console.log('\n=== R1 ambiente ===')
  let ambienteOk = 0
  for (const slug of rooms) {
    const search = await getJson('/api/v2/products/search', { ambiente: slug, per_page: '1' })
    const total = Number(search.total ?? 0)
    if (total > 0) ambienteOk += 1
    console.log(`search?ambiente=${slug} total=${total}`)
  }
  const filtersArredo = await getJson('/api/v2/filters', { category: 'arredo' })
  console.log(
    'filters?category=arredo',
    'ambienti=',
    JSON.stringify(filtersArredo.ambienti ?? []),
    'tipologie=',
    Array.isArray(filtersArredo.tipologie) ? filtersArredo.tipologie.length : 0,
    'stili=',
    Array.isArray(filtersArredo.stili) ? filtersArredo.stili.length : 0,
    'matching=',
    filtersArredo.total_matching,
  )

  console.log('\n=== R2 tipologia / stile ===')
  const tipSearch = await getJson('/api/v2/products/search', {
    category: 'arredo',
    tipologia: 'tavolo',
    per_page: '2',
  })
  console.log(`search?category=arredo&tipologia=tavolo total=${tipSearch.total ?? 0}`)
  const stileSearch = await getJson('/api/v2/products/search', {
    category: 'arredo',
    stile: 'design',
    per_page: '2',
  })
  console.log(`search?category=arredo&stile=design total=${stileSearch.total ?? 0}`)

  console.log('\n=== paradigma category (no world) ===')
  const tecnico = await getJson('/api/v2/filters', { category: 'tecnico', attacco: 'G4' })
  console.log(
    'filters?category=tecnico&attacco=G4 matching=',
    tecnico.total_matching,
    'attacchi=',
    Array.isArray(tecnico.attacchi) ? tecnico.attacchi.length : 0,
  )

  console.log('\n--- summary ---')
  console.log(
    ambienteOk > 0
      ? `R1: OK (${ambienteOk}/${rooms.length} slug con prodotti)`
      : 'R1: API ok ma catalogo ambiente ancora vuoto (0 risultati)',
  )
  console.log(
    Number(tipSearch.total ?? 0) > 0 || Number(stileSearch.total ?? 0) > 0
      ? 'R2: tipologia/stile rispondono su category=arredo'
      : 'R2: ancora vuoto su Arredo',
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
