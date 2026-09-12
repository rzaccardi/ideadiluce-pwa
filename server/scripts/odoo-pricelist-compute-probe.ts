/**
 * Probe: list_price vs lst_price vs product.pricelist._get_product_price
 * Uso: cd server && VARIANT_ID=8718 npx tsx scripts/odoo-pricelist-compute-probe.ts
 */
import { config } from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { env } from '../src/config/env.js'
import { odooExecuteKw } from '../src/adapters/odoo/odooClient.js'

const serverRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
config({ path: path.join(serverRoot, '..', '.env') })

const ctx = { correlationId: 'odoo-pricelist-compute-probe' }
const variantId = Number(process.env.VARIANT_ID ?? 8718)
const lists = [
  Number(env.ODOO_PRICELIST_B2C_ID ?? 5),
  Number(env.ODOO_PRICELIST_PROFESSIONAL_ID ?? 14),
  Number(env.ODOO_PRICELIST_B2B_ID ?? 15),
]

async function tryKw(label: string, fn: () => Promise<unknown>) {
  try {
    return { label, ok: true, result: await fn() }
  } catch (error) {
    return { label, ok: false, error: error instanceof Error ? error.message.slice(0, 400) : String(error).slice(0, 400) }
  }
}

async function main() {
  const items = await odooExecuteKw<
    Array<{
      id: number
      pricelist_id: [number, string]
      applied_on?: string
      compute_price?: string
      percent_price?: number
      fixed_price?: number
      price_discount?: number
      product_tmpl_id?: [number, string] | false
      product_id?: [number, string] | false
    }>
  >(
    ctx,
    'product.pricelist.item',
    'search_read',
    [[
      '|',
      ['product_id', '=', variantId],
      ['product_tmpl_id', '=', 7531],
    ]],
    {
      fields: [
        'id',
        'pricelist_id',
        'applied_on',
        'compute_price',
        'percent_price',
        'fixed_price',
        'price_discount',
        'product_tmpl_id',
        'product_id',
      ],
      limit: 20,
    },
  )

  const reads = []
  for (const pricelist of lists) {
    reads.push(
      await tryKw(`get_product_price ids=[${pricelist}]`, () =>
        odooExecuteKw(ctx, 'product.pricelist', 'get_product_price', [[pricelist], variantId, 1.0, false]),
      ),
    )
    reads.push(
      await tryKw(`get_product_price positional ${pricelist}`, () =>
        odooExecuteKw(ctx, 'product.pricelist', 'get_product_price', [pricelist, variantId, 1.0]),
      ),
    )
    reads.push(
      await tryKw(`price_compute pricelist=${pricelist}`, () =>
        odooExecuteKw(ctx, 'product.product', 'price_compute', [[variantId], 'lst_price'], {
          context: { lang: env.ODOO_CATALOG_LANG, pricelist },
        }),
      ),
    )
    reads.push(
      await tryKw(`_get_combination_info pricelist=${pricelist}`, () =>
        odooExecuteKw(ctx, 'product.template', '_get_combination_info', [[7531]], {
          context: { lang: env.ODOO_CATALOG_LANG, pricelist },
        }),
      ),
    )
  }

  console.log(JSON.stringify({ variantId, items, reads }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
