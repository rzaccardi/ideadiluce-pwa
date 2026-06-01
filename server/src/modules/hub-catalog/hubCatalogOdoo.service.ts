import { env } from '../../config/env.js'
import { isOdooConfigured, odooExecuteKw, type OdooCallContext } from '../../adapters/odoo/odooClient.js'

type TemplateOdooRow = {
  id: number
  list_price: number
  product_variant_ids: number[]
}

type VariantOdooRow = {
  id: number
  list_price: number
  qty_available?: number
  free_qty?: number
}

export type OdooCatalogLiveData = {
  templatePrices: Map<number, number>
  variantPrices: Map<number, number>
  variantStock: Map<number, number>
}

const catalogContext = () => ({ lang: env.ODOO_CATALOG_LANG })

export async function fetchOdooLiveCatalogData(
  ctx: OdooCallContext,
  templateIds: number[],
  variantIds: number[],
): Promise<OdooCatalogLiveData> {
  const empty: OdooCatalogLiveData = {
    templatePrices: new Map(),
    variantPrices: new Map(),
    variantStock: new Map(),
  }

  if (!env.ODOO_ENABLED || !isOdooConfigured()) return empty

  const uniqueTemplates = [...new Set(templateIds.filter((id) => id > 0))]
  const uniqueVariants = [...new Set(variantIds.filter((id) => id > 0))]

  if (uniqueTemplates.length) {
    const rows = await odooExecuteKw<TemplateOdooRow[]>(
      ctx,
      'product.template',
      'read',
      [uniqueTemplates],
      { fields: ['list_price', 'product_variant_ids'], context: catalogContext() },
    )
    for (const row of rows) {
      empty.templatePrices.set(row.id, Math.round(Number(row.list_price || 0) * 100))
    }
  }

  if (uniqueVariants.length) {
    const fieldsMeta = await odooExecuteKw<Record<string, unknown>>(
      ctx,
      'product.product',
      'fields_get',
      [],
      { attributes: ['string'] },
    )
    const qtyField =
      'qty_available' in fieldsMeta ? 'qty_available' : 'free_qty' in fieldsMeta ? 'free_qty' : null
    const fields = ['list_price', ...(qtyField ? [qtyField] : [])]

    const rows = await odooExecuteKw<VariantOdooRow[]>(
      ctx,
      'product.product',
      'read',
      [uniqueVariants],
      { fields, context: catalogContext() },
    )
    for (const row of rows) {
      empty.variantPrices.set(row.id, Math.round(Number(row.list_price || 0) * 100))
      if (qtyField) {
        const qty = Number(row[qtyField as keyof VariantOdooRow] ?? 0)
        empty.variantStock.set(row.id, qty)
      }
    }
  }

  return empty
}

export function resolveHubPriceCents(
  odoo: OdooCatalogLiveData,
  templateId: number | null,
  variantId: number | null,
  fallback = 0,
): number {
  if (variantId != null) {
    const v = odoo.variantPrices.get(variantId)
    if (v != null) return v
  }
  if (templateId != null) {
    const t = odoo.templatePrices.get(templateId)
    if (t != null) return t
  }
  return fallback
}

export function resolveHubInStock(
  odoo: OdooCatalogLiveData,
  variantId: number | null,
  variantIds: number[],
  purchasable: boolean,
): boolean {
  if (!env.ODOO_ENABLED || !isOdooConfigured()) return purchasable
  if (variantId != null && odoo.variantStock.has(variantId)) {
    return (odoo.variantStock.get(variantId) ?? 0) > 0
  }
  if (variantIds.length) {
    return variantIds.some((id) => (odoo.variantStock.get(id) ?? 0) > 0)
  }
  return purchasable
}
