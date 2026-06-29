import { env } from '../../config/env.js'
import { isOdooConfigured, odooExecuteKw, type OdooCallContext } from './odooClient.js'
import {
  pickOdooVariantMatch,
  type OdooVariantCodeMatch,
  type OdooVariantRow,
} from '../../modules/catalog/catalog-code-match.js'

export type { OdooVariantCodeMatch }

/** Lookup diretto Odoo `product.product` per EAN (barcode) o SKU (default_code). */
export async function findOdooVariantByCode(
  ctx: OdooCallContext,
  code: string,
): Promise<OdooVariantCodeMatch | null> {
  if (!env.ODOO_ENABLED || !isOdooConfigured()) return null

  const normalized = code.trim()
  if (!normalized) return null

  const domain: unknown[] = [
    ['sale_ok', '=', true],
    '|',
    ['barcode', '=', normalized],
    ['default_code', '=', normalized],
  ]

  const rows = await odooExecuteKw<OdooVariantRow[]>(
    ctx,
    'product.product',
    'search_read',
    [domain],
    {
      fields: ['id', 'product_tmpl_id', 'default_code', 'barcode'],
      limit: 5,
    },
  )

  return pickOdooVariantMatch(rows, normalized)
}
