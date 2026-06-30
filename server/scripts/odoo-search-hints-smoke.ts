/**
 * Smoke test import query ricerca da Odoo (prodotti più acquistati).
 * Uso: cd server && npx tsx scripts/odoo-search-hints-smoke.ts
 */
import { config } from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { env } from '../src/config/env.js'
import { isOdooConfigured } from '../src/adapters/odoo/odooClient.js'
import { fetchTopPurchasedSearchHints } from '../src/adapters/odoo/odooTopPurchasedSearchHints.js'

const serverRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
config({ path: path.join(serverRoot, '..', '.env') })

async function main() {
  if (!env.ODOO_ENABLED || !isOdooConfigured()) {
    console.log(
      JSON.stringify(
        { ok: false, skipped: true, error: 'Odoo non configurato — smoke test saltato' },
        null,
        2,
      ),
    )
    process.exit(0)
  }

  const apply = process.argv.includes('--apply')
  const lookbackDays = 90
  const limit = 8

  if (apply) {
    const { searchHintsAdminService } = await import('../src/modules/search/search-hints-admin.service.js')
    const result = await searchHintsAdminService.applyFromOdoo(
      { correlationId: 'odoo-search-hints-smoke' },
      { lookbackDays, limit },
    )
    console.log(
      JSON.stringify(
        {
          ok: true,
          applied: true,
          updatedLocales: result.updatedLocales,
          hints: result.hints,
          updatedAt: result.updatedAt,
        },
        null,
        2,
      ),
    )
    process.exit(0)
  }

  const suggestions = await fetchTopPurchasedSearchHints(
    { correlationId: 'odoo-search-hints-smoke' },
    { lookbackDays, limit },
  )

  const ok = suggestions.length > 0
  console.log(
    JSON.stringify(
      {
        ok,
        lookbackDays,
        limit,
        count: suggestions.length,
        queries: suggestions.map((item) => item.query),
        sample: suggestions.slice(0, 3),
      },
      null,
      2,
    ),
  )
  process.exit(ok ? 0 : 1)
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      null,
      2,
    ),
  )
  process.exit(1)
})
