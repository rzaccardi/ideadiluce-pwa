import type { Cart, CartItem, CheckoutSession } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import { cartRepository } from './cart.repository.js'

export type CheckoutPriceSnapshot = {
  pricedAt: string
  currencyCode: string
  items: Array<{
    itemId: string
    productRef: string
    variantRef: string | null
    quantity: number
    unitPriceCents: number
  }>
  estimatedSubtotal: number
  estimatedTax: number
  estimatedShipping: number
  estimatedTotal: number
  taxRatePct?: number
  taxLabel?: string
  disclaimerKey?: string
  odooFiscalPositionId?: number | null
  vatForceAccepted?: boolean
}

const ACTIVE_CHECKOUT_STATES = ['DRAFT', 'COMMITTED', 'REDIRECTING'] as const

export function buildCheckoutPriceSnapshot(
  cart: Cart & { items: CartItem[]; shippingSelection?: { amountCents: number } | null },
  taxMeta?: Partial<
    Pick<
      CheckoutPriceSnapshot,
      | 'estimatedTax'
      | 'taxRatePct'
      | 'taxLabel'
      | 'disclaimerKey'
      | 'odooFiscalPositionId'
      | 'vatForceAccepted'
    >
  >,
): CheckoutPriceSnapshot {
  const items = cart.items
    .map((line) => {
      const unitPriceCents = line.clientUnitPriceEstimate
      if (unitPriceCents == null) return null
      return {
        itemId: line.id,
        productRef: line.productRef,
        variantRef: line.variantRef,
        quantity: line.quantity,
        unitPriceCents,
      }
    })
    .filter((line): line is NonNullable<typeof line> => line != null)

  const estimatedSubtotal = items.reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0)
  const estimatedTax = taxMeta?.estimatedTax ?? cart.estimatedTax ?? 0
  const estimatedShipping =
    cart.shippingSelection?.amountCents ?? cart.estimatedShipping ?? 0
  const estimatedTotal = estimatedSubtotal + estimatedTax + estimatedShipping

  return {
    pricedAt: new Date().toISOString(),
    currencyCode: cart.currencyCode,
    items,
    estimatedSubtotal,
    estimatedTax,
    estimatedShipping,
    estimatedTotal,
    ...(taxMeta?.taxRatePct != null ? { taxRatePct: taxMeta.taxRatePct } : {}),
    ...(taxMeta?.taxLabel ? { taxLabel: taxMeta.taxLabel } : {}),
    ...(taxMeta?.disclaimerKey ? { disclaimerKey: taxMeta.disclaimerKey } : {}),
    ...(taxMeta?.odooFiscalPositionId !== undefined
      ? { odooFiscalPositionId: taxMeta.odooFiscalPositionId }
      : {}),
    ...(taxMeta?.vatForceAccepted ? { vatForceAccepted: taxMeta.vatForceAccepted } : {}),
  }
}

export function parseCheckoutPriceSnapshot(json: unknown): CheckoutPriceSnapshot | null {
  if (!json || typeof json !== 'object') return null
  const row = json as Partial<CheckoutPriceSnapshot>
  if (!Array.isArray(row.items) || typeof row.estimatedSubtotal !== 'number') return null
  return row as CheckoutPriceSnapshot
}

const ACTIVE_ORDER_STATUSES = [
  'DRAFT',
  'CHECKOUT_STARTED',
  'CHECKOUT_LOCKED',
  'PAYMENT_STARTED',
  'PAYMENT_PENDING',
  'PAYMENT_FAILED',
] as const

export async function findActiveCheckoutPriceFreeze(
  cartId: string,
): Promise<(CheckoutSession & { priceSnapshotJson: unknown }) | null> {
  const now = new Date()
  const checkout = await prisma.checkoutSession.findFirst({
    where: {
      cartId,
      state: { in: [...ACTIVE_CHECKOUT_STATES] },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      pwaOrder: {
        is: {
          orderStatus: { in: [...ACTIVE_ORDER_STATUSES] },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
  if (!checkout?.priceSnapshotJson) return null
  return checkout
}

export async function isCartPriceFrozen(cartId: string): Promise<boolean> {
  return (await findActiveCheckoutPriceFreeze(cartId)) != null
}

export async function applyCheckoutPriceSnapshot(
  cartId: string,
  snapshot: CheckoutPriceSnapshot,
): Promise<void> {
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: { items: true },
  })
  if (!cart) return

  const byItemId = new Map(snapshot.items.map((line) => [line.itemId, line]))
  for (const line of cart.items) {
    const frozen = byItemId.get(line.id)
    if (frozen && frozen.unitPriceCents !== line.clientUnitPriceEstimate) {
      await cartRepository.updateItem(line.id, {
        clientUnitPriceEstimate: frozen.unitPriceCents,
      })
    }
  }

  await cartRepository.updateTotals(cartId, {
    estimatedSubtotal: snapshot.estimatedSubtotal,
    estimatedTax: snapshot.estimatedTax,
    estimatedShipping: snapshot.estimatedShipping,
    estimatedTotal: snapshot.estimatedTotal,
    lastPricedAt: new Date(snapshot.pricedAt),
  })
}

export async function saveCheckoutPriceSnapshot(
  checkoutSessionId: string,
  cart: Cart & { items: CartItem[]; shippingSelection?: { amountCents: number } | null },
  taxMeta?: Parameters<typeof buildCheckoutPriceSnapshot>[1],
): Promise<CheckoutPriceSnapshot> {
  const snapshot = buildCheckoutPriceSnapshot(cart, taxMeta)
  await prisma.checkoutSession.update({
    where: { id: checkoutSessionId },
    data: { priceSnapshotJson: snapshot },
  })
  return snapshot
}
