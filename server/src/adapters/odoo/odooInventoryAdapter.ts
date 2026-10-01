import { env } from '../../config/env.js'
import { resolveVariantAvailability } from '../../modules/catalog/availability.service.js'
import { parseOdooTemplateId, parseOdooVariantId } from '../../modules/catalog/odooRef.js'
import { isOdooConfigured, isOdooLiveConfigured, odooExecuteKw, type OdooCallContext } from './odooClient.js'
import { isOdooApiV2Configured } from '../odoo-api/odooApiClient.js'
import { odooApiGetStock } from '../odoo-api/odooApi.resources.js'

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
  /** Lead time max (giorni) dai fornitori `product.supplierinfo`. */
  leadTimeDays: number | null
  restockDate: string | null
  saleOk: boolean
  /** True se esiste almeno un fornitore (backorder oltre stock). */
  orderable: boolean
  hasSuppliers: boolean
  defaultCode?: string | null
}

type SupplierLeadInfo = {
  hasSuppliers: boolean
  leadTimeMax: number | null
}

function pickQtyField(fields: Record<string, unknown>): string | null {
  if ('qty_available' in fields) return 'qty_available'
  if ('free_qty' in fields) return 'free_qty'
  return null
}

const FIELDS_GET_TTL_MS = 30 * 60 * 1000
const fieldsGetCache = new Map<string, { at: number; fields: Record<string, unknown> }>()

async function cachedFieldsGet(
  ctx: OdooCallContext,
  model: string,
): Promise<Record<string, unknown>> {
  const hit = fieldsGetCache.get(model)
  if (hit && Date.now() - hit.at < FIELDS_GET_TTL_MS) return hit.fields

  const fields = await odooExecuteKw<Record<string, unknown>>(ctx, model, 'fields_get', [], {
    attributes: ['string'],
  })
  fieldsGetCache.set(model, { at: Date.now(), fields })
  return fields
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

function m2oId(value: unknown): number | null {
  if (Array.isArray(value) && typeof value[0] === 'number') return value[0]
  if (typeof value === 'number' && Number.isFinite(value)) return value
  return null
}

/**
 * Lead time max e presenza fornitori da `product.supplierinfo` (Acquisti Odoo).
 * Conservativo: se il modello non è leggibile → nessun fornitore.
 */
export async function fetchSupplierLeadByVariantIds(
  ctx: OdooCallContext,
  variantIds: number[],
  variantToTemplate: Map<number, number>,
): Promise<Map<number, SupplierLeadInfo>> {
  const empty = new Map<number, SupplierLeadInfo>()
  for (const id of variantIds) {
    empty.set(id, { hasSuppliers: false, leadTimeMax: null })
  }
  if (!isOdooConfigured() || variantIds.length === 0) return empty

  try {
    const fields = await cachedFieldsGet(ctx, 'product.supplierinfo')
    const readFields = ['delay']
    const hasProductId = 'product_id' in fields
    const hasTmplId = 'product_tmpl_id' in fields
    if (hasProductId) readFields.push('product_id')
    if (hasTmplId) readFields.push('product_tmpl_id')
    if (!hasProductId && !hasTmplId) return empty

    const domain: unknown[] = []
    if (hasProductId) {
      domain.push(['product_id', 'in', variantIds])
    }
    const templateIds = [
      ...new Set(
        [...variantToTemplate.values()].filter((id) => Number.isInteger(id) && id > 0),
      ),
    ]
    if (hasTmplId && templateIds.length > 0) {
      if (domain.length > 0) {
        domain.unshift('|')
      }
      domain.push(['product_tmpl_id', 'in', templateIds])
    }
    if (domain.length === 0) return empty

    const rows = await odooExecuteKw<Array<Record<string, unknown>>>(
      ctx,
      'product.supplierinfo',
      'search_read',
      [domain],
      { fields: readFields, limit: 5000 },
    )

    const byVariant = new Map<number, number[]>()
    const byTemplate = new Map<number, number[]>()

    for (const row of rows) {
      const delayRaw = readNumberField(row, 'delay')
      const delay = delayRaw != null && delayRaw >= 0 ? delayRaw : 0
      const productId = hasProductId ? m2oId(row.product_id) : null
      const tmplId = hasTmplId ? m2oId(row.product_tmpl_id) : null

      // Riga specifica variante (product_id valorizzato)
      if (productId != null && productId > 0) {
        const list = byVariant.get(productId) ?? []
        list.push(delay)
        byVariant.set(productId, list)
        continue
      }
      // Riga a livello template (vale per tutte le varianti del template)
      if (tmplId != null && tmplId > 0) {
        const list = byTemplate.get(tmplId) ?? []
        list.push(delay)
        byTemplate.set(tmplId, list)
      }
    }

    const result = new Map<number, SupplierLeadInfo>()
    for (const variantId of variantIds) {
      const delays: number[] = [...(byVariant.get(variantId) ?? [])]
      const tmplId = variantToTemplate.get(variantId)
      if (tmplId != null) {
        delays.push(...(byTemplate.get(tmplId) ?? []))
      }
      if (delays.length === 0) {
        result.set(variantId, { hasSuppliers: false, leadTimeMax: null })
        continue
      }
      result.set(variantId, {
        hasSuppliers: true,
        leadTimeMax: Math.max(...delays),
      })
    }
    return result
  } catch {
    return empty
  }
}

async function resolveVariantTemplateMap(
  ctx: OdooCallContext,
  variantIds: number[],
): Promise<Map<number, number>> {
  const map = new Map<number, number>()
  if (!isOdooConfigured() || variantIds.length === 0) return map

  try {
    const rows = await odooExecuteKw<Array<Record<string, unknown>>>(
      ctx,
      'product.product',
      'read',
      [variantIds],
      { fields: ['product_tmpl_id'] },
    )
    for (const row of rows) {
      const variantId = readNumberField(row, 'id')
      const tmplId = m2oTemplateId(row.product_tmpl_id)
      if (variantId != null && tmplId != null) {
        map.set(variantId, tmplId)
      }
    }
  } catch {
    // ignore — supplierinfo userà solo match per product_id
  }
  return map
}

/** Batch read stock/lead/orderable da Odoo per varianti `product.product`. */
export async function fetchVariantStockByIds(
  ctx: OdooCallContext,
  variantIds: number[],
): Promise<Map<number, VariantStockSnapshot>> {
  const result = new Map<number, VariantStockSnapshot>()
  if (!env.ODOO_ENABLED || !isOdooLiveConfigured() || variantIds.length === 0) {
    return result
  }

  const uniqueIds = [...new Set(variantIds.filter((id) => Number.isInteger(id) && id > 0))]
  if (uniqueIds.length === 0) return result

  // Path API v2: qty da v2, fornitori da RPC se disponibile
  if (isOdooApiV2Configured()) {
    try {
      const rows = await odooApiGetStock(uniqueIds, ctx.correlationId)
      const variantToTemplate = isOdooConfigured()
        ? await resolveVariantTemplateMap(ctx, uniqueIds)
        : new Map<number, number>()
      const suppliers = isOdooConfigured()
        ? await fetchSupplierLeadByVariantIds(ctx, uniqueIds, variantToTemplate)
        : new Map<number, SupplierLeadInfo>()

      for (const row of rows) {
        const qty = Number(row.free_qty ?? row.qty_available ?? 0)
        const supplier = suppliers.get(row.id) ?? { hasSuppliers: false, leadTimeMax: null }
        const saleOk = true
        const hasSuppliers = supplier.hasSuppliers
        result.set(row.id, {
          variantId: row.id,
          stockQty: Number.isFinite(qty) ? qty : null,
          leadTimeDays: supplier.leadTimeMax,
          restockDate: null,
          saleOk,
          hasSuppliers,
          orderable: saleOk && hasSuppliers,
        })
      }
      return result
    } catch {
      if (!isOdooConfigured()) return result
    }
  }

  if (!isOdooConfigured()) return result

  const fields = await cachedFieldsGet(ctx, 'product.product')
  const qtyField = pickQtyField(fields)
  const readFields = ['sale_ok', 'product_tmpl_id']
  if ('default_code' in fields) readFields.push('default_code')
  if (qtyField) readFields.push(qtyField)
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

  const variantToTemplate = new Map<number, number>()
  for (const row of rows) {
    const variantId = readNumberField(row, 'id')
    const templateId = m2oTemplateId(row.product_tmpl_id)
    if (variantId != null && templateId != null) {
      variantToTemplate.set(variantId, templateId)
    }
  }

  const suppliers = await fetchSupplierLeadByVariantIds(ctx, uniqueIds, variantToTemplate)

  for (const row of rows) {
    const variantId = readNumberField(row, 'id')
    if (variantId == null) continue
    const saleOk = readBoolField(row, 'sale_ok', true)
    const stockQty = qtyField ? readNumberField(row, qtyField) : null
    const restockDate = readRestockDate(row)
    const supplier = suppliers.get(variantId) ?? { hasSuppliers: false, leadTimeMax: null }
    const hasSuppliers = supplier.hasSuppliers
    const defaultCodeRaw = row.default_code
    const defaultCode =
      typeof defaultCodeRaw === 'string' && defaultCodeRaw.trim() ? defaultCodeRaw.trim() : null

    result.set(variantId, {
      variantId,
      stockQty,
      leadTimeDays: supplier.leadTimeMax,
      restockDate,
      saleOk,
      hasSuppliers,
      orderable: saleOk && hasSuppliers,
      defaultCode,
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
  if (!env.ODOO_ENABLED || !isOdooLiveConfigured() || templateIds.length === 0) {
    return map
  }

  if (isOdooApiV2Configured() && !isOdooConfigured()) {
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

async function resolveVariantIds(
  ctx: OdooCallContext,
  lines: Array<{ productRef: string; variantRef?: string | null }>,
): Promise<Array<number | null>> {
  const resolved = lines.map((line) => parseOdooVariantId(line.variantRef))
  const templateIds = [
    ...new Set(
      lines
        .map((line, index) => (resolved[index] == null ? parseOdooTemplateId(line.productRef) : null))
        .filter((id): id is number => id != null),
    ),
  ]
  if (templateIds.length === 0) return resolved

  const firstVariants = await fetchFirstVariantIdsForTemplates(ctx, templateIds)
  return lines.map((line, index) => {
    const direct = resolved[index]
    if (direct != null) return direct
    const templateId = parseOdooTemplateId(line.productRef)
    return templateId == null ? null : (firstVariants.get(templateId) ?? null)
  })
}

export async function checkCartStock(
  ctx: OdooCallContext,
  lines: Array<{ productRef: string; variantRef?: string | null; quantity: number }>,
): Promise<StockCheckResult> {
  if (!env.ODOO_ENABLED || !isOdooConfigured()) {
    return { ok: true, insufficient: [] }
  }

  const insufficient: StockCheckResult['insufficient'] = []
  const variantIdsByLine = await resolveVariantIds(ctx, lines)
  const resolved = lines.map((line, index) => ({ line, variantId: variantIdsByLine[index] ?? null }))

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

  const fields = await cachedFieldsGet(ctx, 'product.product')
  const weightField = 'weight' in fields ? 'weight' : null
  if (!weightField) {
    return Math.max(0.5, lines.reduce((s, l) => s + l.quantity * 0.8, 0))
  }

  const variantIds = await resolveVariantIds(ctx, lines)
  const uniqueIds = [...new Set(variantIds.filter((id): id is number => id != null))]
  const rows = uniqueIds.length
    ? await odooExecuteKw<Array<{ id: number; weight: number }>>(
        ctx,
        'product.product',
        'read',
        [uniqueIds],
        { fields: ['weight'] },
      )
    : []
  const weightById = new Map(rows.map((row) => [row.id, Number(row.weight ?? 0.8)]))
  const total = lines.reduce((sum, line, index) => {
    const variantId = variantIds[index]
    const weight = variantId == null ? 0.8 : (weightById.get(variantId) ?? 0.8)
    return sum + weight * line.quantity
  }, 0)
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

  const fields = await cachedFieldsGet(ctx, 'product.product')
  const lengthFields = ['x_length_m', 'x_length_meters', 'x_length_cm'].filter((f) => f in fields)
  if (lengthFields.length === 0 && 'product_length' in fields) {
    lengthFields.push('product_length')
  }
  if (lengthFields.length === 0) {
    return 0
  }

  const variantIds = await resolveVariantIds(ctx, lines)
  const uniqueIds = [...new Set(variantIds.filter((id): id is number => id != null))]
  const rows = uniqueIds.length
    ? await odooExecuteKw<Array<Record<string, unknown>>>(
        ctx,
        'product.product',
        'read',
        [uniqueIds],
        { fields: lengthFields },
      )
    : []
  let maxLength = 0
  for (const row of rows) {
    const meters = readLengthMetersFromRow(row, lengthFields)
    if (meters != null) {
      maxLength = Math.max(maxLength, meters)
    }
  }
  return maxLength
}

/** Max lead time (giorni) tra le righe carrello da fornitori Odoo. */
export async function estimateCartMaxLeadDays(
  ctx: OdooCallContext,
  lines: Array<{ productRef: string; variantRef?: string | null; quantity: number }>,
): Promise<number | null> {
  if (!env.ODOO_ENABLED || !isOdooConfigured() || lines.length === 0) {
    return null
  }

  const variantIds = await resolveVariantIds(ctx, lines)
  const uniqueIds = [...new Set(variantIds.filter((id): id is number => id != null))]
  if (uniqueIds.length === 0) return null

  const snapshots = await fetchVariantStockByIds(ctx, uniqueIds)
  const leadDays: number[] = []
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]!
    const variantId = variantIds[index]
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
    if (availability.purchasable && availability.effectiveLeadDays > 0) {
      leadDays.push(availability.effectiveLeadDays)
    }
  }

  return leadDays.length > 0 ? Math.max(...leadDays) : null
}
