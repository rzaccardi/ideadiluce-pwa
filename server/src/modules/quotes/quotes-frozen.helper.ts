import { prisma } from '../../lib/prisma.js'
import { cartRepository } from '../cart/cart.repository.js'
import {
  saveCheckoutPriceSnapshot,
  type CheckoutPriceSnapshot,
} from '../cart/cart-price-freeze.service.js'
import type { CheckoutOrderLinesSnapshot } from '../checkout/checkout-order.types.js'

const FROZEN_SHIPPING_METHOD_REF = 'frozen:quote'

/** Applica snapshot preventivo congelato su carrello + selezione spedizione + sessione checkout. */
export async function applyFrozenQuoteSnapshotToCart(
  cartId: string,
  checkoutSessionId: string,
  snapshot: CheckoutOrderLinesSnapshot,
): Promise<CheckoutPriceSnapshot> {
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: { items: true, shippingSelection: true },
  })
  if (!cart) {
    throw new Error(`Cart ${cartId} not found`)
  }

  const priceByRef = new Map(
    snapshot.items.map((line) => [`${line.productRef}:${line.variantRef ?? ''}`, line.unitPriceCents]),
  )

  for (const item of cart.items) {
    const key = `${item.productRef}:${item.variantRef ?? ''}`
    const unitPriceCents = priceByRef.get(key)
    if (unitPriceCents != null && item.clientUnitPriceEstimate !== unitPriceCents) {
      await cartRepository.updateItem(item.id, { clientUnitPriceEstimate: unitPriceCents })
    }
  }

  await prisma.cartShippingSelection.upsert({
    where: { cartId },
    create: {
      cartId,
      methodRef: FROZEN_SHIPPING_METHOD_REF,
      carrierCode: 'frozen',
      serviceCode: 'quote',
      label: 'Spedizione preventivo',
      amountCents: snapshot.estimatedShipping,
      currencyCode: snapshot.currencyCode,
    },
    update: {
      methodRef: FROZEN_SHIPPING_METHOD_REF,
      carrierCode: 'frozen',
      serviceCode: 'quote',
      label: 'Spedizione preventivo',
      amountCents: snapshot.estimatedShipping,
      currencyCode: snapshot.currencyCode,
    },
  })

  await cartRepository.updateTotals(cartId, {
    estimatedSubtotal: snapshot.estimatedSubtotal,
    estimatedTax: snapshot.estimatedTax,
    estimatedShipping: snapshot.estimatedShipping,
    estimatedTotal: snapshot.estimatedTotal,
    lastPricedAt: new Date(snapshot.lockedAt),
  })

  const cartFresh = await prisma.cart.findUnique({
    where: { id: cartId },
    include: { items: true, shippingSelection: true },
  })
  if (!cartFresh) {
    throw new Error(`Cart ${cartId} not found after freeze`)
  }

  return saveCheckoutPriceSnapshot(checkoutSessionId, cartFresh, {
    estimatedTax: snapshot.estimatedTax,
  })
}

export function linesSnapshotFromOdooQuotation(input: {
  currencyCode: string
  amountTotalCents: number
  amountUntaxedCents?: number | null
  amountTaxCents?: number | null
  lines: Array<{
    productId: number | null
    productName: string
    quantity: number
    unitPriceCents: number
    subtotalCents: number
  }>
}): CheckoutOrderLinesSnapshot {
  const items = input.lines
    .filter((line) => line.productId != null && line.quantity > 0)
    .map((line, index) => ({
      itemId: `odoo-line-${line.productId}-${index}`,
      productRef: String(line.productId),
      variantRef: String(line.productId),
      quantity: line.quantity,
      unitPriceCents: line.unitPriceCents,
      lineTotalCents: line.subtotalCents,
    }))

  const estimatedSubtotal =
    input.amountUntaxedCents != null
      ? input.amountUntaxedCents
      : items.reduce((sum, line) => sum + line.lineTotalCents, 0)
  const estimatedTotal = input.amountTotalCents
  const estimatedTax =
    input.amountTaxCents != null
      ? input.amountTaxCents
      : Math.max(0, estimatedTotal - estimatedSubtotal)
  const estimatedShipping = Math.max(0, estimatedTotal - estimatedSubtotal - estimatedTax)

  return {
    lockedAt: new Date().toISOString(),
    currencyCode: input.currencyCode,
    items,
    estimatedSubtotal,
    estimatedTax,
    estimatedShipping,
    estimatedTotal,
  }
}
