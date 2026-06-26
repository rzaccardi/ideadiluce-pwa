import type { Request } from 'express'
import { env } from '../../config/env.js'
import { isOdooConfigured, odooExecuteKw, type OdooCallContext } from '../../adapters/odoo/odooClient.js'
import { prisma } from '../../lib/prisma.js'
import { cartRepository } from '../cart/cart.repository.js'
import { isCartCheckoutPriceLocked } from '../checkout/checkout-order-sync.service.js'
import { computeCartTaxCents } from '../cart/cart-tax.helper.js'
import { parseOdooTemplateId, parseOdooVariantId } from './odooRef.js'
import type { PricingContext } from '../pricing/pricelist.service.js'

function priceContext(pricing?: PricingContext | null) {
  const base: Record<string, unknown> = { lang: env.ODOO_CATALOG_LANG }
  if (pricing?.pricelistId) base.pricelist = pricing.pricelistId
  if (pricing?.partnerId) base.partner_id = pricing.partnerId
  return base
}

/** Prezzo netto IVA esclusa da Odoo `list_price` con context listino/partner. */
export async function unitPriceCentsFromOdoo(
  ctx: OdooCallContext,
  productRef: string,
  variantRef?: string | null,
  pricing?: PricingContext | null,
): Promise<number | null> {
  // Odoo list_price con context listino è netto IVA esclusa (EUR).
  const vid = parseOdooVariantId(variantRef)
  if (vid != null) {
    const rows = await odooExecuteKw<Array<{ list_price: number }>>(
      ctx,
      'product.product',
      'read',
      [[vid]],
      { fields: ['list_price'], context: priceContext(pricing) },
    )
    const p = rows[0]?.list_price
    return p != null ? Math.round(Number(p) * 100) : null
  }
  const productId = parseOdooTemplateId(productRef)
  if (productId == null) return null
  const rows = await odooExecuteKw<Array<{ list_price: number }>>(
    ctx,
    'product.template',
    'read',
    [[productId]],
    { fields: ['list_price'], context: priceContext(pricing) },
  )
  const p = rows[0]?.list_price
  return p != null ? Math.round(Number(p) * 100) : null
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
  let subtotal = 0
  for (const line of cart.items) {
    const unit = await unitPriceCentsFromOdoo(ctx, line.productRef, line.variantRef, pricing)
    if (unit != null) {
      await cartRepository.updateItem(line.id, { clientUnitPriceEstimate: unit })
      subtotal += unit * line.quantity
    } else if (line.clientUnitPriceEstimate != null) {
      subtotal += line.clientUnitPriceEstimate * line.quantity
    }
  }

  const taxResult = await computeCartTaxCents(subtotal, 'IT', {
    customerSegment: pricing?.segment ?? 'RETAIL',
    isProfessional: pricing?.segment === 'PROFESSIONAL',
    isEstimate: true,
  })
  const tax = taxResult.taxCents
  const shipping = cart.shippingSelection?.amountCents ?? cart.estimatedShipping ?? 0
  await cartRepository.updateTotals(cart.id, {
    estimatedSubtotal: subtotal,
    estimatedTax: tax,
    estimatedShipping: shipping,
    estimatedTotal: subtotal + tax + shipping,
    lastPricedAt: new Date(),
  })
}
