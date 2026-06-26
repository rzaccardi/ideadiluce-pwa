/**
 * Checklist listini Odoo per staging — elenca product.pricelist e verifica env.
 * Uso: cd server && ODOO_ENABLED=true npx tsx scripts/odoo-pricelist-checklist.ts
 */
import { config } from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { env } from '../src/config/env.js'
import { isOdooConfigured, odooExecuteKw } from '../src/adapters/odoo/odooClient.js'

const serverRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
config({ path: path.join(serverRoot, '..', '.env') })

async function main() {
  if (!env.ODOO_ENABLED || !isOdooConfigured()) {
    console.log(JSON.stringify({ ok: false, error: 'Odoo non configurato (ODOO_ENABLED + credenziali XML-RPC)' }, null, 2))
    process.exit(1)
  }

  const pricelists = await odooExecuteKw<Array<{ id: number; name: string }>>(
    { correlationId: 'pricelist-checklist' },
    'product.pricelist',
    'search_read',
    [[['active', '=', true]]],
    { fields: ['id', 'name'], limit: 50, order: 'id asc' },
  )

  const configured = {
    ODOO_PRICELIST_B2C_ID: env.ODOO_PRICELIST_B2C_ID ?? null,
    ODOO_PRICELIST_B2B_ID: env.ODOO_PRICELIST_B2B_ID ?? null,
    ODOO_PRICELIST_PROFESSIONAL_ID: env.ODOO_PRICELIST_PROFESSIONAL_ID ?? null,
  }

  const missing = Object.entries(configured)
    .filter(([, v]) => v == null || v <= 0)
    .map(([k]) => k)

  console.log(
    JSON.stringify(
      {
        ok: missing.length === 0,
        configured,
        missingEnv: missing,
        availablePricelists: pricelists.map((p) => ({ id: p.id, name: p.name })),
        checklist: [
          'Impostare ODOO_PRICELIST_B2C_ID, ODOO_PRICELIST_B2B_ID, ODOO_PRICELIST_PROFESSIONAL_ID in .env',
          'Assegnare listino B2B al partner test BUSINESS (OdooCustomerMap 99002)',
          'Assegnare listino Professional al partner test PRO (99003)',
          'Eseguire: ODOO_ENABLED=true npx tsx scripts/micro-sprint-15-validation.ts',
          'Atteso: prezzi diversi anon vs B2B vs PRO; variantPrice.pdpVariantPriceCents = cartPriceCents',
        ],
      },
      null,
      2,
    ),
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
