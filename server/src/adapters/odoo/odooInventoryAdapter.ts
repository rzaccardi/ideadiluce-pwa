import { env } from '../../config/env.js'
import { resolveVariantAvailability } from '../../modules/catalog/availability.service.js'
import { parseOdooTemplateId, parseOdooVariantId } from '../../modules/catalog/odooRef.js'
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

export type VariantStockSnapshot = {
  variantId: number
  stockQty: number | null
  leadTimeDays: number | null
  restockDate: string | null
  saleOk: boolean
  orderable: boolean
}

function pickQtyField(fields: Record<string, unknown>): string | null {
  if ('qty_available' in fields) return 'qty_available'
  if ('free_qty' in fields) return 'free_qty'
  return null
}

function readBoolField(row: Record<string, unknown>, field: string, fallback = true): boolean {
  const value = row[field]
  if (typeof value === 'boolean') return value
  return fallback
}

function readNumberField(row: Record<string, unknown>, field: string): number | null {
  const value = row[field]
  if (value == null || value === false) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function readRestockDate(row: Record<string, unknown>): string | null {
  for (const key of ['x_restock_date', 'restock_date', 'date_planned']) {
    const value = row[key]
    if (typeof value === 'string' && value.trim()) return value
  }
  return null
}

function m2oTemplateId(value: unknown): number | null {
  if (Array.isArray(value) && typeof value[0] === 'number') return value[0]
  if (typeof value === 'number') return value
  return null
}

/** Batch read stock/lead/orderable da Odoo per varianti `product.product`. */
export async function fetchVariantStockByIds(
  ctx: OdooCallContext,
  variantIds: number[],
): Promise<Map<number, VariantStockSnapshot>> {
  const result = new Map<number, VariantStockSnapshot>()
  if (!env.ODOO_ENABLED || !isOdooConfigured() || variantIds.length === 0) {
    return result
  }

  const uniqueIds = [...new Set(variantIds.filter((id) => Number.isInteger(id) && id > 0))]
  if (uniqueIds.length === 0) return result

  const fields = await odooExecuteKw<Record<string, unknown>>(ctx, 'product.product', 'fields_get', [], {
    attributes: ['string'],
  })
  const qtyField = pickQtyField(fields)
  const readFields = ['sale_ok', 'product_tmpl_id']
  if (qtyField) readFields.push(qtyField)
  if ('sale_delay' in fields) readFields.push('sale_delay')
  for (const key of ['x_restock_date', 'restock_date', 'date_planned']) {
    if (key in fields) readFields.push(key)
  }

  const rows = await odooExecuteKw<Array<Record<string, unknown>>>(
    ctx,
    'product.product',
    'read',
    [uniqueIds],
    { fields: readFields },
  )

  const templateIds = [
    ...new Set(
      rows
        .map((row) => m2oTemplateId(row.product_tmpl_id))
        .filter((id): id is number => id != null),
    ),
  ]

  const templateOrderable = new Map<number, boolean>()
  if (templateIds.length > 0) {
    const templateFields = await odooExecuteKw<Record<string, unknown>>(
      ctx,
      'product.template',
      'fields_get',
      [],
      { attributes: ['string'] },
    )
    const templateReadFields = ['sale_ok']
    if ('allow_out_of_stock_order' in templateFields) {
      templateReadFields.push('allow_out_of_stock_order')
    }
    const templates = await odooExecuteKw<Array<Record<string, unknown>>>(
      ctx,
      'product.template',
      'read',
      [templateIds],
      { fields: templateReadFields },
    )
    for (const tpl of templates) {
      const id = readNumberField(tpl, 'id')
      if (id == null) continue
      const saleOk = readBoolField(tpl, 'sale_ok', true)
      const allowOut =
        'allow_out_of_stock_order' in tpl
          ? readBoolField(tpl, 'allow_out_of_stock_order', false)
          : saleOk
      templateOrderable.set(id, saleOk && allowOut)
    }
  }

  for (const row of rows) {
    const variantId = readNumberField(row, 'id')
    if (variantId == null) continue
    const templateId = m2oTemplateId(row.product_tmpl_id)
    const saleOk = readBoolField(row, 'sale_ok', true)
    const stockQty = qtyField ? readNumberField(row, qtyField) : null
    const leadTimeDays = readNumberField(row, 'sale_delay')
    const restockDate = readRestockDate(row)
    const templateAllowsOrder = templateId != null ? (templateOrderable.get(templateId) ?? saleOk) : saleOk
    const orderable = saleOk && templateAllowsOrder

    result.set(variantId, {
      variantId,
      stockQty,
      leadTimeDays,
      restockDate,
      saleOk,
      orderable,
    })
  }

  return result
}

/** Prima variante per ogni `product.template` (per stock card catalogo). */
export async function fetchFirstVariantIdsForTemplates(
  ctx: OdooCallContext,
  templateIds: number[],
): Promise<Map<number, number>> {
  const map = new Map<number, number>()
  if (!env.ODOO_ENABLED || !isOdooConfigured() || templateIds.length === 0) {
    return map
  }

  const uniqueTemplateIds = [...new Set(templateIds.filter((id) => Number.isInteger(id) && id > 0))]
  if (uniqueTemplateIds.length === 0) return map

  const rows = await odooExecuteKw<Array<{ id: number; product_variant_ids: number[] }>>(
    ctx,
    'product.template',
    'read',
    [uniqueTemplateIds],
    { fields: ['product_variant_ids'] },
  )

  for (const row of rows) {
    const firstVariant = row.product_variant_ids?.[0]
    if (firstVariant != null) {
      map.set(row.id, firstVariant)
    }
  }

  return map
}

async function resolveVariantId(
  ctx: OdooCallContext,
  productRef: string,
  variantRef?: string | null,
): Promise<number | null> {
  const vid = parseOdooVariantId(variantRef)
  if (vid != null) return vid
  const productId = parseOdooTemplateId(productRef)
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
  const resolved: Array<{ line: (typeof lines)[number]; variantId: number | null }> = []

  for (const line of lines) {
    const variantId = await resolveVariantId(ctx, line.productRef, line.variantRef)
    resolved.push({ line, variantId })
  }

  const variantIds = resolved
    .map((entry) => entry.variantId)
    .filter((id): id is number => id != null)
  const snapshots = await fetchVariantStockByIds(ctx, variantIds)

  for (const { line, variantId } of resolved) {
    if (variantId == null) continue
    const snap = snapshots.get(variantId)
    if (!snap) continue

    const availability = resolveVariantAvailability(
      {
        stockQty: snap.stockQty,
        restockDate: snap.restockDate,
        leadTimeDays: snap.leadTimeDays,
        saleOk: snap.saleOk,
        orderable: snap.orderable,
      },
      line.quantity,
    )

    if (!availability.purchasable) {
      insufficient.push({
        productRef: line.productRef,
        requested: line.quantity,
        available: Math.max(0, snap.stockQty ?? 0),
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

function readLengthMetersFromRow(row: Record<string, unknown>, lengthFields: string[]): number | null {
  for (const field of lengthFields) {
    const value = readNumberField(row, field)
    if (value == null || value <= 0) continue
    if (field.includes('cm') || field === 'x_length_cm') {
      return value / 100
    }
    return value
  }
  return null
}

/** Max lunghezza prodotto nel carrello (metri), da Odoo o fallback 0. */
export async function estimateCartMaxLengthMeters(
  ctx: OdooCallContext,
  lines: Array<{ productRef: string; variantRef?: string | null; quantity: number }>,
): Promise<number> {
  if (!env.ODOO_ENABLED || !isOdooConfigured() || lines.length === 0) {
    return 0
  }

  const fields = await odooExecuteKw<Record<string, unknown>>(ctx, 'product.product', 'fields_get', [], {
    attributes: ['string'],
  })
  const lengthFields = ['x_length_m', 'x_length_meters', 'x_length_cm'].filter((f) => f in fields)
  if (lengthFields.length === 0 && 'product_length' in fields) {
    lengthFields.push('product_length')
  }
  if (lengthFields.length === 0) {
    return 0
  }

  let maxLength = 0
  for (const line of lines) {
    const variantId = await resolveVariantId(ctx, line.productRef, line.variantRef)
    if (variantId == null) continue
    const rows = await odooExecuteKw<Array<Record<string, unknown>>>(
      ctx,
      'product.product',
      'read',
      [[variantId]],
      { fields: lengthFields },
    )
    const meters = readLengthMetersFromRow(rows[0] ?? {}, lengthFields)
    if (meters != null) {
      maxLength = Math.max(maxLength, meters)
    }
  }
  return maxLength
}

/** Max lead time (giorni) tra le righe carrello da Odoo. */
export async function estimateCartMaxLeadDays(
  ctx: OdooCallContext,
  lines: Array<{ productRef: string; variantRef?: string | null; quantity: number }>,
): Promise<number | null> {
  if (!env.ODOO_ENABLED || !isOdooConfigured() || lines.length === 0) {
    return null
  }

  const fields = await odooExecuteKw<Record<string, unknown>>(ctx, 'product.product', 'fields_get', [], {
    attributes: ['string'],
  })
  if (!('sale_delay' in fields)) return null

  const leadDays: number[] = []
  for (const line of lines) {
    const variantId = await resolveVariantId(ctx, line.productRef, line.variantRef)
    if (variantId == null) continue
    const rows = await odooExecuteKw<Array<Record<string, unknown>>>(
      ctx,
      'product.product',
      'read',
      [[variantId]],
      { fields: ['sale_delay'] },
    )
    const days = readNumberField(rows[0] ?? {}, 'sale_delay')
    if (days != null && days > 0) {
      leadDays.push(days)
    }
  }

  return leadDays.length > 0 ? Math.max(...leadDays) : null
}
