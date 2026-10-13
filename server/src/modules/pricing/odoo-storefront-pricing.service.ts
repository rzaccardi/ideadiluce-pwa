/**
 * Prezzi storefront: Odoo calcola sempre (`GET /prices`, `POST /orders/totals`).
 * XML-RPC listino locale non è più source of truth per vendita.
 */
import { isOdooApiV2Configured } from '../../adapters/odoo-api/odooApiClient.js'
import {
  odooApiComputeOrderTotals,
  odooApiGetPrices,
} from '../../adapters/odoo-api/odooApi.resources.js'
import type {
  OdooApiOrderTotalsResponse,
  OdooApiPriceItem,
  OdooApiPricesResponse,
} from '../../adapters/odoo-api/odooApi.types.js'
import { parseOdooVariantId } from '../catalog/odooRef.js'
import { eurosToCents } from './pricelist-item-price.js'

export type StorefrontPriceRow = {
  productId: number
  priceCents: number
  listPriceCents: number | null
  publicPriceCents: number | null
  discountPct: number | null
  source: 'public' | 'customer' | null
}

export type StorefrontTotalsLine = {
  lineId: string
  productId: number
  qty: number
  priceUnitNetCents: number
  listPriceCents: number | null
  discountPct: number | null
  priceSource: string | null
  taxRatePct: number | null
}

export type StorefrontTotalsResult = {
  lines: StorefrontTotalsLine[]
  subtotalNetCents: number
  amountTaxCents: number
  amountTotalCents: number
  taxRatePct: number | null
  snapshotAt: string
  warnings: string[]
  fromCache: boolean
}

type PricesCacheEntry = {
  snapshotAt: string
  byId: Map<number, StorefrontPriceRow>
  taxRatePct: number | null
}

const pricesCache = new Map<string, PricesCacheEntry>()

function cacheKey(customerId: number | null | undefined, qty: number): string {
  return `${customerId ?? 0}:${qty}`
}

function toPriceRow(item: OdooApiPriceItem): StorefrontPriceRow | null {
  if (!Number.isInteger(item.id) || item.id <= 0) return null
  if (item.price == null || !Number.isFinite(item.price)) return null
  return {
    productId: item.id,
    priceCents: eurosToCents(item.price),
    listPriceCents:
      item.list_price != null && Number.isFinite(item.list_price)
        ? eurosToCents(item.list_price)
        : null,
    publicPriceCents:
      item.public_price != null && Number.isFinite(item.public_price)
        ? eurosToCents(item.public_price)
        : null,
    discountPct:
      item.discount_pct != null && Number.isFinite(item.discount_pct) && item.discount_pct > 0
        ? item.discount_pct
        : null,
    source: item.source === 'customer' || item.source === 'public' ? item.source : null,
  }
}

function rememberPrices(
  customerId: number | null | undefined,
  qty: number,
  response: OdooApiPricesResponse,
  taxRatePct?: number | null,
) {
  const key = cacheKey(customerId, qty)
  const prev = pricesCache.get(key)
  const byId = new Map(prev?.byId ?? [])
  for (const item of response.items ?? []) {
    const row = toPriceRow(item)
    if (row) byId.set(row.productId, row)
  }
  pricesCache.set(key, {
    snapshotAt: response.snapshot_at ?? new Date().toISOString(),
    byId,
    taxRatePct: taxRatePct ?? prev?.taxRatePct ?? null,
  })
}

export function getCachedStorefrontPrices(
  productIds: number[],
  customerId?: number | null,
  qty = 1,
): { rows: Map<number, StorefrontPriceRow>; snapshotAt: string | null; taxRatePct: number | null } {
  const entry = pricesCache.get(cacheKey(customerId, qty))
  const rows = new Map<number, StorefrontPriceRow>()
  if (!entry) return { rows, snapshotAt: null, taxRatePct: null }
  for (const id of productIds) {
    const row = entry.byId.get(id)
    if (row) rows.set(id, row)
  }
  return { rows, snapshotAt: entry.snapshotAt, taxRatePct: entry.taxRatePct }
}

export function rememberTaxRateFromTotals(customerId: number | null | undefined, taxRatePct: number | null) {
  if (taxRatePct == null) return
  for (const qty of [1]) {
    const key = cacheKey(customerId, qty)
    const prev = pricesCache.get(key)
    if (!prev) continue
    pricesCache.set(key, { ...prev, taxRatePct })
  }
}

function primaryTaxRate(taxRates: OdooApiOrderTotalsResponse['tax_rates']): number | null {
  if (typeof taxRates === 'number' && Number.isFinite(taxRates)) return taxRates
  if (Array.isArray(taxRates)) {
    const first = taxRates.find((r) => typeof r === 'number' && Number.isFinite(r))
    return first ?? null
  }
  if (taxRates && typeof taxRates === 'object') {
    const values = Object.values(taxRates).filter((r): r is number => typeof r === 'number' && Number.isFinite(r))
    return values[0] ?? null
  }
  return null
}

function eurosOrCentsToCents(value: number | undefined, alreadyCents?: number | undefined): number | null {
  if (alreadyCents != null && Number.isFinite(alreadyCents)) return Math.round(alreadyCents)
  if (value == null || !Number.isFinite(value)) return null
  // Heuristic: values >= 1000 without decimals often already cents; Odoo nets are euros.
  return eurosToCents(value)
}

export async function fetchStorefrontPrices(input: {
  productIds: number[]
  customerId?: number | null
  qty?: number
  correlationId?: string
}): Promise<{ rows: Map<number, StorefrontPriceRow>; snapshotAt: string; fromCache: boolean }> {
  const ids = [...new Set(input.productIds.filter((id) => Number.isInteger(id) && id > 0))]
  const qty = input.qty ?? 1
  const empty = {
    rows: new Map<number, StorefrontPriceRow>(),
    snapshotAt: new Date().toISOString(),
    fromCache: true,
  }
  if (ids.length === 0) return empty

  if (!isOdooApiV2Configured()) {
    const cached = getCachedStorefrontPrices(ids, input.customerId, qty)
    return {
      rows: cached.rows,
      snapshotAt: cached.snapshotAt ?? empty.snapshotAt,
      fromCache: true,
    }
  }

  try {
    const response = await odooApiGetPrices({
      ids,
      customerId: input.customerId,
      qty,
      correlationId: input.correlationId,
    })
    rememberPrices(input.customerId, qty, response)
    const rows = new Map<number, StorefrontPriceRow>()
    for (const item of response.items ?? []) {
      const row = toPriceRow(item)
      if (row) rows.set(row.productId, row)
    }
    return {
      rows,
      snapshotAt: response.snapshot_at ?? new Date().toISOString(),
      fromCache: false,
    }
  } catch {
    const cached = getCachedStorefrontPrices(ids, input.customerId, qty)
    return {
      rows: cached.rows,
      snapshotAt: cached.snapshotAt ?? empty.snapshotAt,
      fromCache: true,
    }
  }
}

export async function fetchStorefrontOrderTotals(input: {
  lines: Array<{ lineId: string; productId: number; qty: number; priceUnitNetEuros?: number }>
  customerId?: number | null
  currency?: string
  correlationId?: string
  /** Se true e totals fallisce, ricostruisce da cache /prices. */
  allowCacheFallback?: boolean
}): Promise<StorefrontTotalsResult | null> {
  const usable = input.lines.filter((l) => Number.isInteger(l.productId) && l.productId > 0 && l.qty > 0)
  if (usable.length === 0) return null

  const mapResult = (
    data: OdooApiOrderTotalsResponse,
    fromCache: boolean,
  ): StorefrontTotalsResult => {
    const taxRatePct = primaryTaxRate(data.tax_rates)
    rememberTaxRateFromTotals(input.customerId, taxRatePct)
    const byProduct = new Map((data.lines ?? []).map((line) => [line.product_id, line]))
    const lines: StorefrontTotalsLine[] = usable.map((line) => {
      const row = byProduct.get(line.productId)
      const unit =
        row != null
          ? eurosOrCentsToCents(row.price_unit_net, row.subtotal_net_cents != null && row.qty
              ? Math.round(row.subtotal_net_cents / row.qty)
              : undefined)
          : null
      return {
        lineId: line.lineId,
        productId: line.productId,
        qty: line.qty,
        priceUnitNetCents: unit ?? 0,
        listPriceCents:
          row?.list_price != null && Number.isFinite(row.list_price)
            ? eurosToCents(row.list_price)
            : null,
        discountPct:
          row?.discount_pct != null && Number.isFinite(row.discount_pct) && row.discount_pct > 0
            ? row.discount_pct
            : null,
        priceSource: row?.price_source != null ? String(row.price_source) : null,
        taxRatePct: row?.tax_rate ?? taxRatePct,
      }
    })

    const subtotalFromLines = lines.reduce((sum, l) => sum + l.priceUnitNetCents * l.qty, 0)
    const subtotalNetCents =
      data.subtotal_net_cents != null && Number.isFinite(data.subtotal_net_cents)
        ? Math.round(data.subtotal_net_cents)
        : subtotalFromLines
    const amountTaxCents =
      data.amount_tax_cents != null && Number.isFinite(data.amount_tax_cents)
        ? Math.round(data.amount_tax_cents)
        : taxRatePct != null
          ? Math.round((subtotalNetCents * taxRatePct) / 100)
          : 0
    const amountTotalCents =
      data.amount_total_cents != null && Number.isFinite(data.amount_total_cents)
        ? Math.round(data.amount_total_cents)
        : subtotalNetCents + amountTaxCents

    return {
      lines,
      subtotalNetCents,
      amountTaxCents,
      amountTotalCents,
      taxRatePct,
      snapshotAt: data.snapshot_at ?? new Date().toISOString(),
      warnings: Array.isArray(data.warnings) ? data.warnings.filter((w) => typeof w === 'string') : [],
      fromCache,
    }
  }

  if (isOdooApiV2Configured()) {
    try {
      const data = await odooApiComputeOrderTotals(
        {
          customer_id: input.customerId && input.customerId > 0 ? input.customerId : undefined,
          currency: input.currency ?? 'EUR',
          lines: usable.map((line) => ({
            product_id: line.productId,
            qty: line.qty,
            ...(line.priceUnitNetEuros != null ? { price_unit_net: line.priceUnitNetEuros } : {}),
          })),
        },
        input.correlationId,
      )
      // Cache unit prices from totals for offline fallback
      rememberPrices(
        input.customerId,
        1,
        {
          snapshot_at: data.snapshot_at,
          items: (data.lines ?? []).map((line) => ({
            id: line.product_id,
            list_price: line.list_price ?? line.price_unit_net,
            price: line.price_unit_net,
            discount_pct: line.discount_pct,
            source:
              line.price_source === 'customer' || line.price_source === 'public'
                ? line.price_source
                : undefined,
          })),
        },
        primaryTaxRate(data.tax_rates),
      )
      return mapResult(data, false)
    } catch {
      if (!input.allowCacheFallback) return null
    }
  } else if (!input.allowCacheFallback) {
    return null
  }

  const productIds = usable.map((l) => l.productId)
  const cached = getCachedStorefrontPrices(productIds, input.customerId, 1)
  if (cached.rows.size === 0) return null

  const taxRatePct = cached.taxRatePct ?? 22
  const lines: StorefrontTotalsLine[] = usable.map((line) => {
    const row = cached.rows.get(line.productId)
    const unit = row?.priceCents ?? 0
    return {
      lineId: line.lineId,
      productId: line.productId,
      qty: line.qty,
      priceUnitNetCents: unit,
      listPriceCents: row?.listPriceCents ?? null,
      discountPct: row?.discountPct ?? null,
      priceSource: row?.source ?? null,
      taxRatePct,
    }
  })
  const subtotalNetCents = lines.reduce((sum, l) => sum + l.priceUnitNetCents * l.qty, 0)
  const amountTaxCents = Math.round((subtotalNetCents * taxRatePct) / 100)
  return {
    lines,
    subtotalNetCents,
    amountTaxCents,
    amountTotalCents: subtotalNetCents + amountTaxCents,
    taxRatePct,
    snapshotAt: cached.snapshotAt ?? new Date().toISOString(),
    warnings: ['Prezzi da cache locale: Odoo totals non raggiungibile.'],
    fromCache: true,
  }
}

export function resolveVariantProductIds(
  lines: Array<{ lineId: string; variantRef: string | null; quantity: number }>,
): Array<{ lineId: string; productId: number; qty: number }> {
  const out: Array<{ lineId: string; productId: number; qty: number }> = []
  for (const line of lines) {
    const productId = parseOdooVariantId(line.variantRef)
    if (productId == null) continue
    out.push({ lineId: line.lineId, productId, qty: line.quantity })
  }
  return out
}
