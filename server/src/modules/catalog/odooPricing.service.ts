import type { Request } from 'express'
import { env } from '../../config/env.js'
import { isOdooConfigured, odooExecuteKw, type OdooCallContext } from '../../adapters/odoo/odooClient.js'
import { prisma } from '../../lib/prisma.js'
import { cartRepository } from '../cart/cart.repository.js'
import { parseOdooTemplateId, parseOdooVariantId } from './odooRef.js'

async function unitPriceCentsFromOdoo(
  ctx: OdooCallContext,
  productRef: string,
  variantRef?: string | null,
): Promise<number | null> {
  const vid = parseOdooVariantId(variantRef)
  if (vid != null) {
    const rows = await odooExecuteKw<Array<{ list_price: number }>>(
      ctx,
      'product.product',
      'read',
      [[vid]],
      { fields: ['list_price'] },
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
    { fields: ['list_price'] },
  )
  const p = rows[0]?.list_price
  return p != null ? Math.round(Number(p) * 100) : null
}

export async function repriceCartFromOdoo(req: Request, cartId: string): Promise<void> {
  if (!env.ODOO_ENABLED || !isOdooConfigured()) return

  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: { items: true, shippingSelection: true },
  })
  if (!cart) return

  const ctx: OdooCallContext = { correlationId: req.correlationId, req }
  let subtotal = 0
  for (const line of cart.items) {
    const unit = await unitPriceCentsFromOdoo(ctx, line.productRef, line.variantRef)
    if (unit != null) {
      await cartRepository.updateItem(line.id, { clientUnitPriceEstimate: unit })
      subtotal += unit * line.quantity
    } else if (line.clientUnitPriceEstimate != null) {
      subtotal += line.clientUnitPriceEstimate * line.quantity
    }
  }

  const tax = Math.round(subtotal * 0.22)
  const shipping = cart.shippingSelection?.amountCents ?? cart.estimatedShipping ?? 0
  await cartRepository.updateTotals(cart.id, {
    estimatedSubtotal: subtotal,
    estimatedTax: tax,
    estimatedShipping: shipping,
    estimatedTotal: subtotal + tax + shipping,
    lastPricedAt: new Date(),
  })
}
