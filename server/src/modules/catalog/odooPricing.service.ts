import type { Request } from 'express'
import { env } from '../../config/env.js'
import { isOdooConfigured, odooExecuteKw, type OdooCallContext } from '../../adapters/odoo/odooClient.js'
import { prisma } from '../../lib/prisma.js'
import { isCartCheckoutPriceLocked } from '../checkout/checkout-order-sync.service.js'
import { computeCartTaxCents } from '../cart/cart-tax.helper.js'
import { parseOdooTemplateId, parseOdooVariantId } from './odooRef.js'
import type { PricingContext } from '../pricing/pricelist.service.js'

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
  return prices
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

/** Prezzo netto IVA esclusa da Odoo `list_price` con context listino/partner. */
export async function unitPriceCentsFromOdoo(
  ctx: OdooCallContext,
  productRef: string,
  variantRef?: string | null,
  pricing?: PricingContext | null,
): Promise<number | null> {
  const prices = await resolveCartLineUnitPricesCents(
    ctx,
    [{ lineId: '__single__', productRef, variantRef: variantRef ?? null }],
    pricing,
  )
  return prices.get('__single__') ?? null
}

export async function repriceCartFromOdoo(
  req: Request,
  cartId: string,
  pricing?: PricingContext | null,
): Promise<void> {
  if (!env.ODOO_ENABLED || !isOdooConfigured()) return

  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: { items: true, shippingSelection: true },
  })
  if (!cart) return

  if (await isCartCheckoutPriceLocked(cartId)) return

  const ctx: OdooCallContext = { correlationId: req.correlationId, req }
  const unitPrices = await resolveCartLineUnitPricesCents(
    ctx,
    cart.items.map((line) => ({
      lineId: line.id,
      productRef: line.productRef,
      variantRef: line.variantRef,
    })),
    pricing,
  )

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
  const tax = taxResult.taxCents
  const shipping = cart.shippingSelection?.amountCents ?? cart.estimatedShipping ?? 0
  await prisma.cart.update({
    where: { id: cart.id },
    data: {
      estimatedSubtotal: subtotal,
      estimatedTax: tax,
      estimatedShipping: shipping,
      estimatedTotal: subtotal + tax + shipping,
      lastPricedAt: new Date(),
    },
  })
}
