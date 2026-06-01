import { env } from '../../config/env.js'
import { isOdooConfigured, odooExecuteKw, type OdooCallContext } from './odooClient.js'

export type StockCheckLine = {
  productRef: string
  variantRef?: string | null
  quantity: number
  available: number
  variantId: number
}

export type StockCheckResult = {
  ok: boolean
  insufficient: Array<{ productRef: string; requested: number; available: number }>
}

function idFromProductRef(productRef: string): number | null {
  const match = /-(\d+)$/.exec(productRef) ?? /^p-(\d+)$/.exec(productRef)
  if (!match) return null
  const id = Number(match[1])
  return Number.isInteger(id) && id > 0 ? id : null
}

function idFromVariantRef(variantRef: string | null | undefined): number | null {
  const match = variantRef ? /^VAR-(\d+)$/.exec(variantRef) : null
  if (!match) return null
  const id = Number(match[1])
  return Number.isInteger(id) && id > 0 ? id : null
}

async function resolveVariantId(
  ctx: OdooCallContext,
  productRef: string,
  variantRef?: string | null,
): Promise<number | null> {
  const vid = idFromVariantRef(variantRef)
  if (vid != null) return vid
  const productId = idFromProductRef(productRef)
  if (productId == null) return null
  const rows = await odooExecuteKw<Array<{ product_variant_ids: number[] }>>(
    ctx,
    'product.template',
    'read',
    [[productId]],
    { fields: ['product_variant_ids'] },
  )
  return rows[0]?.product_variant_ids?.[0] ?? null
}

export async function checkCartStock(
  ctx: OdooCallContext,
  lines: Array<{ productRef: string; variantRef?: string | null; quantity: number }>,
): Promise<StockCheckResult> {
  if (!env.ODOO_ENABLED || !isOdooConfigured()) {
    return { ok: true, insufficient: [] }
  }

  const insufficient: StockCheckResult['insufficient'] = []
  const fields = await odooExecuteKw<Record<string, unknown>>(ctx, 'product.product', 'fields_get', [], {
    attributes: ['string'],
  })
  const hasQty = 'qty_available' in fields || 'free_qty' in fields
  const qtyField = 'qty_available' in fields ? 'qty_available' : 'free_qty'

  if (!hasQty) {
    return { ok: true, insufficient: [] }
  }

  for (const line of lines) {
    const variantId = await resolveVariantId(ctx, line.productRef, line.variantRef)
    if (variantId == null) continue
    const rows = await odooExecuteKw<Array<Record<string, number>>>(
      ctx,
      'product.product',
      'read',
      [[variantId]],
      { fields: [qtyField] },
    )
    const available = Number(rows[0]?.[qtyField] ?? 0)
    if (available < line.quantity) {
      insufficient.push({
        productRef: line.productRef,
        requested: line.quantity,
        available: Math.max(0, available),
      })
    }
  }

  return { ok: insufficient.length === 0, insufficient }
}

export async function estimateCartWeightKg(
  ctx: OdooCallContext,
  lines: Array<{ productRef: string; variantRef?: string | null; quantity: number }>,
): Promise<number> {
  if (!env.ODOO_ENABLED || !isOdooConfigured()) {
    return Math.max(0.5, lines.reduce((s, l) => s + l.quantity * 0.8, 0))
  }

  const fields = await odooExecuteKw<Record<string, unknown>>(ctx, 'product.product', 'fields_get', [], {
    attributes: ['string'],
  })
  const weightField = 'weight' in fields ? 'weight' : null
  if (!weightField) {
    return Math.max(0.5, lines.reduce((s, l) => s + l.quantity * 0.8, 0))
  }

  let total = 0
  for (const line of lines) {
    const variantId = await resolveVariantId(ctx, line.productRef, line.variantRef)
    if (variantId == null) {
      total += line.quantity * 0.8
      continue
    }
    const rows = await odooExecuteKw<Array<{ weight: number }>>(
      ctx,
      'product.product',
      'read',
      [[variantId]],
      { fields: ['weight'] },
    )
    const w = Number(rows[0]?.weight ?? 0.8)
    total += w * line.quantity
  }
  return Math.max(0.2, total)
}
