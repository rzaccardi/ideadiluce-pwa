/**
 * Smoke live contro Odoo v2 search + filters.
 * Uso: cd server && npx tsx scripts/odoo-search-filters-smoke.ts
 */
import 'dotenv/config'
import { config as loadDotenv } from 'dotenv'
import { resolve } from 'node:path'

loadDotenv({ path: resolve(process.cwd(), '../.env') })
loadDotenv({ path: resolve(process.cwd(), '.env') })

const base = (process.env.ODOO_CATALOG_BASE_URL ?? '').replace(/\/$/, '')
const key = process.env.ODOO_CATALOG_API_KEY?.trim() || process.env.ODOO_API_KEY?.trim() || ''
const website = process.env.ODOO_WEBSITE_ID || '2'

async function getJson(path: string, params: Record<string, string>) {
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
  return { status: res.status, body, url: url.toString() }
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg)
}

async function main() {
  if (!base || !key) {
    console.error('ODOO_CATALOG_BASE_URL / ODOO_CATALOG_API_KEY mancanti')
    process.exit(1)
  }

  console.log('→ GET /api/v2/filters?world=technical')
  const filters = await getJson('/api/v2/filters', { world: 'technical' })
  assert(filters.status === 200, `filters HTTP ${filters.status}`)
  const f = filters.body as {
    total_matching?: number
    worlds?: unknown[]
    attacchi?: unknown[]
    wattaggi?: unknown[]
  }
  assert(typeof f.total_matching === 'number', 'filters.total_matching mancante')
  assert(Array.isArray(f.worlds), 'filters.worlds mancante')
  console.log(`  total_matching=${f.total_matching} worlds=${f.worlds?.length} attacchi=${f.attacchi?.length ?? 0}`)

  console.log('→ GET /api/v2/products/search?world=technical&attacco=G4&per_page=5')
  const search = await getJson('/api/v2/products/search', {
    world: 'technical',
    attacco: 'G4',
    page: '1',
    per_page: '5',
    sort: 'relevance',
  })
  assert(search.status === 200, `search HTTP ${search.status}`)
  const s = search.body as {
    total?: number
    items?: Array<{ id?: number; slug?: string; brand?: unknown; category_slug?: string }>
    applied_filters?: unknown
  }
  assert(typeof s.total === 'number', 'search.total mancante')
  assert(Array.isArray(s.items), 'search.items mancante')
  console.log(`  total=${s.total} items=${s.items?.length} applied_filters=${JSON.stringify(s.applied_filters)}`)
  if (s.items?.[0]) {
    console.log(`  first: id=${s.items[0].id} slug=${s.items[0].slug} category_slug=${s.items[0].category_slug}`)
  }

  // Coerenza: total search ≈ total_matching filters (stessi filtri base world+attacco)
  console.log('→ GET /api/v2/filters?world=technical&attacco=G4')
  const filtersG4 = await getJson('/api/v2/filters', { world: 'technical', attacco: 'G4' })
  assert(filtersG4.status === 200, `filters G4 HTTP ${filtersG4.status}`)
  const fg = filtersG4.body as { total_matching?: number }
  assert(fg.total_matching === s.total, `incoerenza total: search=${s.total} filters=${fg.total_matching}`)
  console.log(`  ✓ total_matching (${fg.total_matching}) == search.total (${s.total})`)

  console.log('\nOK — search + filters Odoo v2 rispondono correttamente')
}

main().catch((e) => {
  console.error('FAIL', e)
  process.exit(1)
})
