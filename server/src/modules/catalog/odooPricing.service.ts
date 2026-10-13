import { env } from '../../config/env.js'
import { isOdooConfigured, odooExecuteKw, type OdooCallContext } from '../../adapters/odoo/odooClient.js'
import { prisma } from '../../lib/prisma.js'
import { isCartCheckoutPriceLocked } from '../checkout/checkout-order-sync.service.js'
import { computeCartTaxCents } from '../cart/cart-tax.helper.js'
import { parseOdooTemplateId, parseOdooVariantId } from './odooRef.js'
import type { PricingContext } from '../pricing/pricelist.service.js'
import {
  applyPricelistItemToListPriceEuros,
  eurosToCents,
  type OdooPricelistItemRow,
} from '../pricing/pricelist-item-price.js'

type OdooPriceModel = 'product.product' | 'product.template'

export type CartLinePriceInput = {
  lineId: string
  productRef: string
  variantRef: string | null
}

function priceContext(pricing?: PricingContext | null) {
  const base: Record<string, unknown> = { lang: env.ODOO_CATALOG_LANG }
  if (pricing?.pricelistId) base.pricelist = pricing.pricelistId
  if (pricing?.partnerId) base.partner_id = pricing.partnerId
  return base
}

async function readOdooListPricesCents(
  ctx: OdooCallContext,
  model: OdooPriceModel,
  ids: number[],
  pricing?: PricingContext | null,
): Promise<Map<number, number>> {
  const prices = new Map<number, number>()
  const uniqueIds = [...new Set(ids.filter((id) => Number.isInteger(id) && id > 0))]
  if (uniqueIds.length === 0) return prices

  const rows = await odooExecuteKw<Array<{ id: number; list_price: number }>>(
    ctx,
    model,
    'read',
    [uniqueIds],
    { fields: ['list_price'], context: priceContext(pricing) },
  )
  for (const row of rows) {
    if (row.list_price == null) continue
    prices.set(row.id, Math.round(Number(row.list_price) * 100))
  }

  if (pricing?.pricelistId) {
    await overlayPricelistItemPrices(ctx, model, uniqueIds, pricing.pricelistId, prices, rows)
  }
  return prices
}

async function overlayPricelistItemPrices(
  ctx: OdooCallContext,
  model: OdooPriceModel,
  ids: number[],
  pricelistId: number,
  prices: Map<number, number>,
  listRows: Array<{ id: number; list_price: number }>,
) {
  const productField = model === 'product.product' ? 'product_id' : 'product_tmpl_id'
  let items: OdooPricelistItemRow[]
  try {
    items = await odooExecuteKw<OdooPricelistItemRow[]>(
      ctx,
      'product.pricelist.item',
      'search_read',
      [[['pricelist_id', '=', pricelistId], [productField, 'in', ids]]],
      {
        fields: [
          'applied_on',
          'compute_price',
          'fixed_price',
          'percent_price',
          'price_discount',
          'price_surcharge',
          'min_quantity',
          'product_id',
          'product_tmpl_id',
        ],
        limit: Math.max(ids.length * 4, 80),
      },
    )
  } catch {
    return
  }

  const listEuros = new Map(listRows.map((row) => [row.id, Number(row.list_price)]))
  for (const item of items) {
    const targetId =
      model === 'product.product'
        ? Array.isArray(item.product_id)
          ? item.product_id[0]
          : null
        : Array.isArray(item.product_tmpl_id)
          ? item.product_tmpl_id[0]
          : null
    if (targetId == null || !ids.includes(targetId)) continue
    const base = listEuros.get(targetId)
    if (base == null) continue
    const euros = applyPricelistItemToListPriceEuros(base, item)
    if (euros == null || euros <= 0) continue
    prices.set(targetId, eurosToCents(euros))
  }
}

/** Prezzi unitari (centesimi) per righe carrello: al massimo 2 read Odoo (varianti + template). */
export async function resolveCartLineUnitPricesCents(
  ctx: OdooCallContext,
  lines: CartLinePriceInput[],
  pricing?: PricingContext | null,
): Promise<Map<string, number | null>> {
  const result = new Map<string, number | null>()
  if (lines.length === 0) return result

  const variantLines: Array<{ lineId: string; variantId: number }> = []
  const templateLines: Array<{ lineId: string; templateId: number }> = []

  for (const line of lines) {
    const variantId = parseOdooVariantId(line.variantRef)
    if (variantId != null) {
      variantLines.push({ lineId: line.lineId, variantId })
      continue
    }
    const templateId = parseOdooTemplateId(line.productRef)
    if (templateId != null) {
      templateLines.push({ lineId: line.lineId, templateId })
    } else {
      result.set(line.lineId, null)
    }
  }

  const [variantPrices, templatePrices] = await Promise.all([
    readOdooListPricesCents(
      ctx,
      'product.product',
      variantLines.map((line) => line.variantId),
      pricing,
    ),
    readOdooListPricesCents(
      ctx,
      'product.template',
      templateLines.map((line) => line.templateId),
      pricing,
    ),
  ])

  for (const line of variantLines) {
    result.set(line.lineId, variantPrices.get(line.variantId) ?? null)
  }
  for (const line of templateLines) {
    result.set(line.lineId, templatePrices.get(line.templateId) ?? null)
  }
  return result
}

/**
 * Prezzo unitario storefront: `GET /api/v2/prices` (Odoo calcola).
 * Fallback cache; XML-RPC solo se API v2 non configurata (smoke/admin legacy).
 */
export async function unitPriceCentsFromOdoo(
  ctx: OdooCallContext,
  productRef: string,
  variantRef?: string | null,
  pricing?: PricingContext | null,
): Promise<number | null> {
  const { isOdooApiV2Configured } = await import('../../adapters/odoo-api/odooApiClient.js')
  const variantId = parseOdooVariantId(variantRef)
  if (isOdooApiV2Configured() && variantId != null) {
    const { fetchStorefrontPrices } = await import('../pricing/odoo-storefront-pricing.service.js')
    const { rows } = await fetchStorefrontPrices({
      productIds: [variantId],
      customerId: pricing?.partnerId ?? null,
      qty: 1,
      correlationId: ctx.correlationId,
    })
    return rows.get(variantId)?.priceCents ?? null
  }

  const prices = await resolveCartLineUnitPricesCents(
    ctx,
    [{ lineId: '__single__', productRef, variantRef: variantRef ?? null }],
    pricing,
  )
  return prices.get('__single__') ?? null
}

/** Reprice carrello: `POST /orders/totals` (source of truth); cache se Odoo down. */
export async function repriceCartFromOdoo(
  ctx: OdooCallContext,
  cartId: string,
  pricing?: PricingContext | null,
): Promise<void> {
  if (!env.ODOO_ENABLED) return

  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: { items: true, shippingSelection: true },
  })
  if (!cart) return

  if (await isCartCheckoutPriceLocked(cartId)) return

  const { isOdooApiV2Configured } = await import('../../adapters/odoo-api/odooApiClient.js')
  const { setCartPricingMeta } = await import('../pricing/cart-pricing-meta.js')
  const {
    fetchStorefrontOrderTotals,
    fetchStorefrontPrices,
    resolveVariantProductIds,
  } = await import('../pricing/odoo-storefront-pricing.service.js')

  if (isOdooApiV2Configured()) {
    const totalsLines = resolveVariantProductIds(
      cart.items.map((line) => ({
        lineId: line.id,
        variantRef: line.variantRef,
        quantity: line.quantity,
      })),
    )

    const totals = await fetchStorefrontOrderTotals({
      lines: totalsLines,
      customerId: pricing?.partnerId ?? null,
      currency: cart.currencyCode || 'EUR',
      correlationId: ctx.correlationId,
      allowCacheFallback: true,
    })

    if (totals) {
      const itemUpdates = totals.lines
        .filter((line) => line.priceUnitNetCents > 0)
        .map((line) => ({
          id: line.lineId,
          clientUnitPriceEstimate: line.priceUnitNetCents,
        }))

      if (itemUpdates.length > 0) {
        await prisma.$transaction(
          itemUpdates.map((item) =>
            prisma.cartItem.update({
              where: { id: item.id },
              data: { clientUnitPriceEstimate: item.clientUnitPriceEstimate },
            }),
          ),
        )
      }

      const shipping = cart.shippingSelection?.amountCents ?? null
      const amountTotal =
        totals.amountTotalCents + (shipping ?? 0)
      await prisma.cart.update({
        where: { id: cart.id },
        data: {
          estimatedSubtotal: totals.subtotalNetCents,
          estimatedTax: totals.amountTaxCents,
          estimatedShipping: shipping,
          estimatedTotal: amountTotal,
          lastPricedAt: new Date(totals.snapshotAt),
        },
      })

      const needsConfirmation = totals.warnings.some((w) =>
        /price_unit_net|prezzo|price/i.test(w),
      )
      setCartPricingMeta(cartId, {
        snapshotAt: totals.snapshotAt,
        fromCache: totals.fromCache,
        warnings: totals.warnings,
        needsConfirmation,
        taxRatePct: totals.taxRatePct,
      })
      return
    }

    // Totals assenti: prova solo /prices per unitari + IVA da cache/tax service stima UI
    const priceIds = totalsLines.map((l) => l.productId)
    const { rows, snapshotAt, fromCache } = await fetchStorefrontPrices({
      productIds: priceIds,
      customerId: pricing?.partnerId ?? null,
      qty: 1,
      correlationId: ctx.correlationId,
    })
    const itemUpdates: Array<{ id: string; clientUnitPriceEstimate: number }> = []
    let subtotal = 0
    for (const line of cart.items) {
      const productId = parseOdooVariantId(line.variantRef)
      const unit = productId != null ? rows.get(productId)?.priceCents : null
      if (unit != null) {
        itemUpdates.push({ id: line.id, clientUnitPriceEstimate: unit })
        subtotal += unit * line.quantity
      } else if (line.clientUnitPriceEstimate != null) {
        subtotal += line.clientUnitPriceEstimate * line.quantity
      }
    }
    if (itemUpdates.length > 0) {
      await prisma.$transaction(
        itemUpdates.map((item) =>
          prisma.cartItem.update({
            where: { id: item.id },
            data: { clientUnitPriceEstimate: item.clientUnitPriceEstimate },
          }),
        ),
      )
    }
    const taxResult = await computeCartTaxCents(subtotal, 'IT', {
      customerSegment: pricing?.segment ?? 'RETAIL',
      isProfessional: pricing?.segment === 'PROFESSIONAL',
      isEstimate: true,
    })
    const shipping = cart.shippingSelection?.amountCents ?? null
    await prisma.cart.update({
      where: { id: cart.id },
      data: {
        estimatedSubtotal: subtotal,
        estimatedTax: taxResult.taxCents,
        estimatedShipping: shipping,
        estimatedTotal: subtotal + taxResult.taxCents + (shipping ?? 0),
        lastPricedAt: new Date(snapshotAt),
      },
    })
    setCartPricingMeta(cartId, {
      snapshotAt,
      fromCache,
      warnings: fromCache ? ['Prezzi da cache: totals Odoo non disponibili.'] : [],
      needsConfirmation: fromCache,
      taxRatePct: taxResult.taxRatePct,
    })
    return
  }

  // Legacy XML-RPC solo se API v2 non configurata
  if (!isOdooConfigured()) return

  let unitPrices: Map<string, number | null>
  try {
    unitPrices = await resolveCartLineUnitPricesCents(
      ctx,
      cart.items.map((line) => ({
        lineId: line.id,
        productRef: line.productRef,
        variantRef: line.variantRef,
      })),
      pricing,
    )
  } catch {
    return
  }

  const itemUpdates: Array<{ id: string; clientUnitPriceEstimate: number }> = []
  let subtotal = 0
  for (const line of cart.items) {
    const unit = unitPrices.get(line.id)
    if (unit != null) {
      itemUpdates.push({ id: line.id, clientUnitPriceEstimate: unit })
      subtotal += unit * line.quantity
    } else if (line.clientUnitPriceEstimate != null) {
      subtotal += line.clientUnitPriceEstimate * line.quantity
    }
  }

  if (itemUpdates.length > 0) {
    await prisma.$transaction(
      itemUpdates.map((item) =>
        prisma.cartItem.update({
          where: { id: item.id },
          data: { clientUnitPriceEstimate: item.clientUnitPriceEstimate },
        }),
      ),
    )
  }

  const taxResult = await computeCartTaxCents(subtotal, 'IT', {
    customerSegment: pricing?.segment ?? 'RETAIL',
    isProfessional: pricing?.segment === 'PROFESSIONAL',
    isEstimate: true,
  })
  const shipping = cart.shippingSelection?.amountCents ?? null
  await prisma.cart.update({
    where: { id: cart.id },
    data: {
      estimatedSubtotal: subtotal,
      estimatedTax: taxResult.taxCents,
      estimatedShipping: shipping,
      estimatedTotal: subtotal + taxResult.taxCents + (shipping ?? 0),
      lastPricedAt: new Date(),
    },
  })
}
