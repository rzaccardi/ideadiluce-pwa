import type { Request } from 'express'
import type Stripe from 'stripe'
import { prisma } from '../../lib/prisma.js'
import { logger } from '../../lib/logger.js'
import { retrieveStripeCheckoutSession } from '../../adapters/payments/stripeCheckoutAdapter.js'
import { syncSaleOrderFunnelState } from '../../adapters/odoo/odooFunnelSync.js'
import type { OdooCallContext } from '../../adapters/odoo/odooClient.js'
import { orderStatusToDTO, paymentMethodToDTO, paymentStatusToDTO } from './payment.types.js'
import { env } from '../../config/env.js'
import { createOdooPaymentAdapter } from '../../adapters/odoo/odooPaymentAdapter.js'
import { createOdooOrderAdapter } from '../../adapters/odoo/odooOrderAdapter.js'

const paymentUrlAdapter = createOdooPaymentAdapter()
const orderAdapter = createOdooOrderAdapter()

export async function finalizeStripeCheckoutByOrderId(req: Request, orderId: string) {
  const payment = await prisma.pwaPayment.findFirst({
    where: { orderId, provider: 'stripe', providerSessionId: { not: null } },
    orderBy: { createdAt: 'desc' },
  })
  if (!payment?.providerSessionId) {
    return { orderId, alreadyProcessed: false }
  }
  return finalizeStripeCheckout(req, payment.providerSessionId)
}

export async function finalizeStripeCheckout(
  req: Request,
  sessionId: string,
): Promise<{ orderId: string; alreadyProcessed: boolean }> {
  const session = await retrieveStripeCheckoutSession(sessionId)
  const pwaOrderId = session.metadata?.pwa_order_id
  if (!pwaOrderId) {
    throw new Error('Sessione Stripe senza pwa_order_id')
  }

  if (session.payment_status !== 'paid') {
    return { orderId: pwaOrderId, alreadyProcessed: false }
  }

  const existing = await prisma.webhookEvent.findFirst({
    where: { source: 'stripe', externalId: `session:${session.id}`, processed: true },
  })
  if (existing) {
    return { orderId: pwaOrderId, alreadyProcessed: true }
  }

  const order = await prisma.pwaOrder.findUnique({
    where: { id: pwaOrderId },
    include: { payments: { orderBy: { createdAt: 'desc' }, take: 1 } },
  })
  if (!order) throw new Error(`PwaOrder ${pwaOrderId} non trovato`)

  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id ?? null

  const stripeTotal = session.amount_total ?? 0
  const expectedTotal = order.amountTotal ?? 0
  if (expectedTotal > 0 && Math.abs(stripeTotal - expectedTotal) > 2) {
    logger.warn('stripe.amount_mismatch', {
      pwaOrderId,
      stripeTotal,
      expectedTotal,
      correlationId: req.correlationId,
    })
    await prisma.pwaOrder.update({
      where: { id: order.id },
      data: {
        lastPaymentError: `Importo Stripe (${stripeTotal}) diverso da ordine (${expectedTotal}). Conferma Odoo bloccata.`,
      },
    })
    await prisma.webhookEvent.create({
      data: {
        source: 'stripe',
        eventName: 'checkout.session.completed',
        externalId: `session:${session.id}`,
        processed: true,
        processedAt: new Date(),
        result: 'amount_mismatch',
        payloadRedacted: { sessionId: session.id } as object,
      },
    })
    return { orderId: pwaOrderId, alreadyProcessed: false }
  }

  const payment = order.payments[0]
  if (payment) {
    await prisma.pwaPayment.update({
      where: { id: payment.id },
      data: {
        status: 'CAPTURED',
        providerTransactionId: paymentIntentId,
        capturedAt: new Date(),
      },
    })
  }

  const updated = await prisma.pwaOrder.update({
    where: { id: order.id },
    data: {
      orderStatus: 'PAID',
      paymentStatus: 'CAPTURED',
      paymentMethod: 'STRIPE',
      providerTransactionId: paymentIntentId,
      paidAt: new Date(),
      lastPaymentError: null,
    },
  })

  await prisma.cart.update({
    where: { id: updated.cartId },
    data: { status: 'CONVERTED', convertedOrderId: updated.id },
  })

  const ctx: OdooCallContext = { correlationId: req.correlationId, req }
  if (env.ODOO_ENABLED && updated.odooSaleOrderId) {
    const cart = await prisma.cart.findUnique({
      where: { id: updated.cartId },
      include: { items: true, shippingSelection: true },
    })
    if (cart) {
      try {
        await orderAdapter.reconcileSaleOrderLines(
          ctx,
          updated.odooSaleOrderId,
          cart.items.map((i) => ({
            productRef: i.productRef,
            variantRef: i.variantRef,
            quantity: i.quantity,
            unitPriceCents: i.clientUnitPriceEstimate ?? undefined,
          })),
          cart.shippingSelection
            ? {
                label: cart.shippingSelection.label,
                amountCents: cart.shippingSelection.amountCents,
                carrierCode: cart.shippingSelection.carrierCode,
                serviceCode: cart.shippingSelection.serviceCode,
              }
            : null,
        )
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        await prisma.pwaOrder.update({
          where: { id: updated.id },
          data: {
            lastPaymentError: `Pagamento ricevuto ma sync Odoo righe fallita: ${msg}`,
            odooLastSyncStatus: 'FAILED',
          },
        })
        await prisma.webhookEvent.create({
          data: {
            source: 'stripe',
            eventName: 'checkout.session.completed',
            externalId: `session:${session.id}`,
            processed: true,
            processedAt: new Date(),
            result: 'odoo_reconcile_failed',
            payloadRedacted: { sessionId: session.id, error: msg } as object,
          },
        })
        return { orderId: pwaOrderId, alreadyProcessed: false }
      }
    }
    await syncSaleOrderFunnelState(ctx, updated.odooSaleOrderId, {
      pwaOrderId: updated.id,
      orderStatus: 'paid',
      paymentStatus: 'captured',
      paymentMethod: 'stripe',
      cartId: updated.cartId,
      sessionId: updated.sessionId,
      providerTransactionId: paymentIntentId,
    })
  }

  if (updated.userId && updated.odooSaleOrderId) {
    let portalUrl: string | null = null
    try {
      const urlResult = await paymentUrlAdapter.createPortalPaymentUrl(ctx, {
        documentModel: 'sale.order',
        documentId: updated.odooSaleOrderId,
      })
      portalUrl = urlResult.paymentUrl
    } catch {
      /* optional */
    }
    await prisma.orderCache.upsert({
      where: { id: `pwa-${updated.id}` },
      create: {
        id: `pwa-${updated.id}`,
        userId: updated.userId,
        odooSaleOrderId: updated.odooSaleOrderId,
        status: 'sale',
        paymentStatus: 'paid',
        currencyCode: updated.currencyCode,
        totalAmount: updated.amountTotal,
        snapshotJson: {
          pwaOrderId: updated.id,
          odooPortalUrl: portalUrl,
        },
      },
      update: {
        status: 'sale',
        paymentStatus: 'paid',
        totalAmount: updated.amountTotal,
        syncedAt: new Date(),
        snapshotJson: {
          pwaOrderId: updated.id,
          odooPortalUrl: portalUrl,
        },
      },
    })
  }

  await prisma.webhookEvent.create({
    data: {
      source: 'stripe',
      eventName: 'checkout.session.completed',
      externalId: `session:${session.id}`,
      processed: true,
      processedAt: new Date(),
      result: 'ok',
      payloadRedacted: { sessionId: session.id, paymentIntentId } as object,
    },
  })

  logger.info('stripe.finalized', {
    orderId: updated.id,
    orderStatus: orderStatusToDTO(updated.orderStatus),
    paymentStatus: paymentStatusToDTO(updated.paymentStatus),
    paymentMethod: paymentMethodToDTO(updated.paymentMethod!),
  })

  return { orderId: pwaOrderId, alreadyProcessed: false }
}

export async function handleStripeWebhookEvent(req: Request, event: Stripe.Event) {
  const dup = await prisma.webhookEvent.findFirst({
    where: { source: 'stripe', externalId: event.id, processed: true },
  })
  if (dup) return

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    if (session.id) await finalizeStripeCheckout(req, session.id)
    return
  }

  await prisma.webhookEvent.create({
    data: {
      source: 'stripe',
      eventName: event.type,
      externalId: event.id,
      processed: true,
      processedAt: new Date(),
      result: 'ignored',
    },
  })
}
