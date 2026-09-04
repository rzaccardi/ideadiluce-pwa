import { prisma } from '../../lib/prisma.js'
import { logger } from '../../lib/logger.js'
import { env } from '../../config/env.js'
import { isOdooConfigured, type OdooCallContext } from '../../adapters/odoo/odooClient.js'
import { createOdooOrderAdapter } from '../../adapters/odoo/odooOrderAdapter.js'
import { repriceCartFromOdoo } from '../catalog/odooPricing.service.js'
import { syncRetryJobService } from '../sync-retry/sync-retry.service.js'
import { ACTIVE_DRAFT_ORDER_STATUSES } from '../checkout/checkout-order.types.js'
import { isCartCheckoutPriceLocked } from '../checkout/checkout-order-sync.service.js'
import { resolveAccountPricing, type PricingContext } from '../pricing/pricelist.service.js'

const orderAdapter = createOdooOrderAdapter()

const inflight = new Map<string, Promise<void>>()
const dirty = new Set<string>()

export type CartOdooPrepInput = {
  cartId: string
  correlationId: string
}

async function pricingForCart(
  cart: { userId: string | null },
  correlationId: string,
): Promise<PricingContext> {
  if (!cart.userId) {
    return resolveAccountPricing({
      segment: 'RETAIL',
      correlationId,
    })
  }

  const [user, map] = await Promise.all([
    prisma.user.findUnique({
      where: { id: cart.userId },
      select: { customerSegment: true, odooPricelistId: true },
    }),
    prisma.odooCustomerMap.findUnique({ where: { userId: cart.userId } }),
  ])

  return resolveAccountPricing({
    segment: user?.customerSegment ?? 'RETAIL',
    odooPricelistId: user?.odooPricelistId,
    partnerId: map?.odooPartnerId ?? null,
    correlationId,
  })
}

async function syncDraftSaleOrderIfPresent(input: CartOdooPrepInput): Promise<void> {
  if (!env.ODOO_ENABLED || !isOdooConfigured()) return

  const order = await prisma.pwaOrder.findFirst({
    where: {
      cartId: input.cartId,
      orderStatus: { in: [...ACTIVE_DRAFT_ORDER_STATUSES] },
      odooSaleOrderId: { not: null },
      odooPartnerId: { not: null },
    },
    orderBy: { updatedAt: 'desc' },
  })
  if (!order?.odooSaleOrderId || !order.odooPartnerId) return
  if (await isCartCheckoutPriceLocked(input.cartId)) return

  const cart = await prisma.cart.findUnique({
    where: { id: input.cartId },
    include: { items: true, shippingSelection: true },
  })
  if (!cart || cart.items.length === 0) return

  const ctx: OdooCallContext = { correlationId: input.correlationId }
  const shipping = cart.shippingSelection
  await orderAdapter.createOrUpdateSaleOrder(ctx, {
    odooPartnerId: order.odooPartnerId,
    odooSaleOrderId: order.odooSaleOrderId,
    clientOrderRef: order.clientOrderRef ?? `PWA ${order.id}`,
    orderNotes: order.orderNotes ?? undefined,
    courierNotes: order.courierNotes ?? undefined,
    currencyCode: cart.currencyCode,
    lines: cart.items.map((line) => ({
      productRef: line.productRef,
      variantRef: line.variantRef,
      quantity: line.quantity,
      unitPriceCents: line.clientUnitPriceEstimate ?? undefined,
    })),
    shippingLine: shipping
      ? {
          label: shipping.label,
          amountCents: shipping.amountCents,
          carrierCode: shipping.carrierCode,
          serviceCode: shipping.serviceCode,
        }
      : null,
  })
}

export async function prepareCartAgainstOdoo(input: CartOdooPrepInput): Promise<void> {
  const cart = await prisma.cart.findUnique({
    where: { id: input.cartId },
    select: { id: true, userId: true, status: true },
  })
  if (!cart || cart.status !== 'ACTIVE') return

  const ctx: OdooCallContext = { correlationId: input.correlationId }
  const pricing = await pricingForCart(cart, input.correlationId)
  await repriceCartFromOdoo(ctx, input.cartId, pricing)
  await syncDraftSaleOrderIfPresent(input)
}

async function enqueuePrepRetry(input: CartOdooPrepInput, err: unknown) {
  const message = err instanceof Error ? err.message : String(err)
  logger.warn('cart.odoo_prep_failed', {
    cartId: input.cartId,
    correlationId: input.correlationId,
    err: message,
  })
  try {
    const existing = await prisma.syncRetryJob.findFirst({
      where: {
        service: 'odoo',
        operation: 'cart_prep',
        entityType: 'cart',
        entityId: input.cartId,
        status: { in: ['PENDING', 'PROCESSING'] },
      },
      select: { id: true },
    })
    if (existing) return
    await syncRetryJobService.enqueue({
      service: 'odoo',
      operation: 'cart_prep',
      entityType: 'cart',
      entityId: input.cartId,
      payload: { correlationId: input.correlationId },
    })
  } catch (enqueueErr) {
    logger.warn('cart.odoo_prep_enqueue_failed', {
      cartId: input.cartId,
      err: enqueueErr instanceof Error ? enqueueErr.message : String(enqueueErr),
    })
  }
}

async function drainCartOdooPrep(input: CartOdooPrepInput): Promise<void> {
  if (inflight.has(input.cartId)) return

  const run = (async () => {
    try {
      while (dirty.has(input.cartId)) {
        dirty.delete(input.cartId)
        await prepareCartAgainstOdoo(input)
      }
    } catch (err) {
      await enqueuePrepRetry(input, err)
    } finally {
      inflight.delete(input.cartId)
      if (dirty.has(input.cartId)) {
        void drainCartOdooPrep(input)
      }
    }
  })()

  inflight.set(input.cartId, run)
}

/** Prepara prezzi/stock e eventuale sale.order draft senza bloccare la response HTTP. */
export function scheduleCartOdooPrep(input: CartOdooPrepInput): void {
  if (!input.cartId) return
  dirty.add(input.cartId)
  void drainCartOdooPrep(input)
}
