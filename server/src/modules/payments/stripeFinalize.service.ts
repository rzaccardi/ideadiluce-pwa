import type { Request } from 'express'
import type Stripe from 'stripe'
import { prisma } from '../../lib/prisma.js'
import { logger } from '../../lib/logger.js'
import { retrieveStripeCheckoutSession } from '../../adapters/payments/stripeCheckoutAdapter.js'
import { stripeAmountsMatch } from './stripe-line-items.js'
import {
  parseOdooSaleOrderIdFromStripeMetadata,
  resolveOdooSaleOrderIdForFinalize,
} from './stripe-odoo-link.js'
import { registerPayment } from '../../adapters/odoo/odooPaymentLive.js'
import type { OdooCallContext } from '../../adapters/odoo/odooClient.js'
import { isOdooApiV2Configured } from '../../adapters/odoo-api/odooApiClient.js'
import { orderStatusToDTO, paymentMethodToDTO, paymentStatusToDTO } from './payment.types.js'
import { env } from '../../config/env.js'
import { createOdooPaymentAdapter } from '../../adapters/odoo/odooPaymentAdapter.js'
import { createOdooOrderAdapter } from '../../adapters/odoo/odooOrderAdapter.js'
import { enqueueOdooSyncFailure, enqueueOrderOdooSaga } from '../odoo/odoo-sync-queue.service.js'
import { writeStructuredIntegrationLog } from '../../lib/integration-log-context.js'
import { orderTransactionalMail } from '../orders/order-transactional-mail.service.js'
import { canStripeReturnMutateOrder } from './payment-session-guard.js'
import { healBankTransferFalselyMarkedFailed } from './bank-transfer-order-heal.js'
import { AppError, isAppError } from '../../types/errors.js'

const paymentUrlAdapter = createOdooPaymentAdapter()
const orderAdapter = createOdooOrderAdapter()

/** Non marca l’ordine come pagato se la verifica Odoo fallisce (retriable → lascia ritentabile). */
async function persistStripeOdooVerifyFailure(input: {
  orderId: string
  paymentId?: string | null
  err: AppError
}): Promise<void> {
  const retriable = input.err.retriable || input.err.statusCode === 503
  if (retriable) {
    await prisma.pwaOrder.update({
      where: { id: input.orderId },
      data: {
        lastPaymentError: input.err.userMessage,
        odooLastSyncStatus: 'FAILED',
      },
    })
    return
  }

  await prisma.pwaOrder.update({
    where: { id: input.orderId },
    data: {
      orderStatus: 'PAYMENT_FAILED',
      paymentStatus: 'FAILED',
      lastPaymentError: input.err.userMessage,
      odooLastSyncStatus: 'FAILED',
      paidAt: null,
    },
  })
  if (input.paymentId) {
    await prisma.pwaPayment.update({
      where: { id: input.paymentId },
      data: { status: 'FAILED', failedAt: new Date() },
    })
  }
}

export async function finalizeStripeCheckoutByOrderId(req: Request, orderId: string) {
  await healBankTransferFalselyMarkedFailed(orderId)

  const order = await prisma.pwaOrder.findUnique({
    where: { id: orderId },
    select: { paymentMethod: true, orderStatus: true },
  })
  if (!order || !canStripeReturnMutateOrder(order)) {
    return { orderId, alreadyProcessed: false }
  }

  const payment = await prisma.pwaPayment.findFirst({
    where: {
      orderId,
      provider: 'stripe',
      providerSessionId: { not: null },
      status: { in: ['CREATED', 'PENDING', 'AUTHORIZED'] },
    },
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
    const failedStatuses = ['unpaid', 'no_payment_required']
    if (failedStatuses.includes(session.payment_status)) {
      const current = await prisma.pwaOrder.findUnique({
        where: { id: pwaOrderId },
        select: { paymentMethod: true, orderStatus: true },
      })
      if (current && canStripeReturnMutateOrder(current)) {
        await prisma.pwaOrder.update({
          where: { id: pwaOrderId },
          data: {
            orderStatus: 'PAYMENT_FAILED',
            paymentStatus: 'FAILED',
            lastPaymentError: 'Pagamento non completato o rifiutato.',
          },
        })
        await prisma.pwaPayment.updateMany({
          where: {
            orderId: pwaOrderId,
            provider: 'stripe',
            status: { in: ['CREATED', 'PENDING', 'AUTHORIZED'] },
          },
          data: { status: 'FAILED', failedAt: new Date() },
        })
      }
    }
    return { orderId: pwaOrderId, alreadyProcessed: false }
  }

  const existing = await prisma.webhookEvent.findFirst({
    where: { source: 'stripe', externalId: `session:${session.id}`, processed: true },
  })
  if (existing) {
    const already = await prisma.pwaOrder.findUnique({ where: { id: pwaOrderId } })
    if (already && ['PAID', 'PAID_SYNC_PENDING', 'SYNCED', 'CONFIRMED', 'COMPLETED'].includes(already.orderStatus)) {
      await orderTransactionalMail.notifyPaidCustomer(already, req.correlationId ?? 'stripe-finalize')
    }
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

  const odooSaleOrderId = resolveOdooSaleOrderIdForFinalize({
    fromStripe: parseOdooSaleOrderIdFromStripeMetadata(session.metadata),
    fromOrder: order.odooSaleOrderId,
  })

  const stripeTotal = session.amount_total ?? 0
  const expectedTotal = order.amountTotal ?? 0
  if (expectedTotal > 0 && !stripeAmountsMatch(stripeTotal, expectedTotal)) {
    logger.warn('stripe.amount_mismatch', {
      pwaOrderId,
      stripeTotal,
      expectedTotal,
      odooSaleOrderId,
      correlationId: req.correlationId,
    })
    await prisma.pwaOrder.update({
      where: { id: order.id },
      data: {
        ...(odooSaleOrderId != null && order.odooSaleOrderId !== odooSaleOrderId
          ? { odooSaleOrderId }
          : {}),
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
  const saleOrderId = odooSaleOrderId ?? order.odooSaleOrderId
  const ctx: OdooCallContext = { correlationId: req.correlationId, req }

  // Verifica Odoo PRIMA di marcare l’ordine come pagato: il cliente non deve vedere "pagato" se Odoo rifiuta.
  let odooRegisterSynced = false
  if (env.ODOO_ENABLED && saleOrderId) {
    const cart = await prisma.cart.findUnique({
      where: { id: order.cartId },
      include: { items: true, shippingSelection: true },
    })
    if (cart && !isOdooApiV2Configured()) {
      try {
        await orderAdapter.reconcileSaleOrderLines(
          ctx,
          saleOrderId,
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
        const verifyErr = new AppError(
          'payment_service_unavailable',
          msg,
          'Verifica del pagamento temporaneamente non disponibile. Riprova tra poco.',
          503,
          true,
        )
        await persistStripeOdooVerifyFailure({
          orderId: order.id,
          paymentId: payment?.id,
          err: verifyErr,
        })
        await enqueueOdooSyncFailure({
          pwaOrderId: order.id,
          operation: 'reconcile_lines',
          payload: {
            pwaOrderId: order.id,
            odooSaleOrderId: saleOrderId,
            lines: cart.items.map((i) => ({
              productRef: i.productRef,
              variantRef: i.variantRef,
              quantity: i.quantity,
              unitPriceCents: i.clientUnitPriceEstimate ?? undefined,
            })),
            shippingLine: cart.shippingSelection
              ? {
                  label: cart.shippingSelection.label,
                  amountCents: cart.shippingSelection.amountCents,
                  carrierCode: cart.shippingSelection.carrierCode,
                  serviceCode: cart.shippingSelection.serviceCode,
                }
              : null,
          },
          lastError: msg,
        })
        await writeStructuredIntegrationLog({
          service: 'stripe',
          operation: 'checkout_finalize',
          correlationId: ctx.correlationId,
          success: false,
          orderId: order.id,
          odooSaleOrderId: saleOrderId ?? undefined,
          error: msg,
          extra: { step: 'reconcile_lines', sessionId: session.id },
        })
        throw verifyErr
      }
    }

    let funnelResult: Awaited<ReturnType<typeof registerPayment>>
    try {
      funnelResult = await registerPayment(ctx, {
        saleOrderId,
        pwaOrderId: order.id,
        method: 'stripe',
        amountCents: order.amountTotal ?? stripeTotal,
        transactionId: paymentIntentId,
        status: 'captured',
      })
    } catch (e) {
      const appErr = isAppError(e)
        ? e
        : new AppError(
            'payment_service_unavailable',
            e instanceof Error ? e.message : String(e),
            'Verifica del pagamento temporaneamente non disponibile. Riprova tra poco.',
            503,
            true,
          )
      await persistStripeOdooVerifyFailure({
        orderId: order.id,
        paymentId: payment?.id,
        err: appErr,
      })
      await writeStructuredIntegrationLog({
        service: 'stripe',
        operation: 'checkout_finalize',
        correlationId: ctx.correlationId,
        success: false,
        orderId: order.id,
        odooSaleOrderId: saleOrderId ?? undefined,
        error: appErr.message,
        extra: { step: 'register_payment', code: appErr.code, sessionId: session.id },
      })
      if (!appErr.retriable) {
        await prisma.webhookEvent.create({
          data: {
            source: 'stripe',
            eventName: 'checkout.session.completed',
            externalId: `session:${session.id}`,
            processed: true,
            processedAt: new Date(),
            result: `payment_verify_failed:${appErr.code}`,
            payloadRedacted: { sessionId: session.id, code: appErr.code } as object,
          },
        })
      }
      throw appErr
    }

    if (funnelResult.status === 'failed') {
      const amountConflict = new AppError(
        'ODOO_API_CONFLICT',
        'Odoo payment amount conflict',
        'Il pagamento non è allineato con l’ordine. Contatta l’assistenza.',
        409,
        false,
      )
      await persistStripeOdooVerifyFailure({
        orderId: order.id,
        paymentId: payment?.id,
        err: amountConflict,
      })
      await enqueueOdooSyncFailure({
        pwaOrderId: order.id,
        operation: 'funnel_sync',
        payload: {
          pwaOrderId: order.id,
          funnelState: {
            pwaOrderId: order.id,
            orderStatus: 'payment_failed',
            paymentStatus: 'failed',
            paymentMethod: 'stripe',
            cartId: order.cartId,
            sessionId: order.sessionId,
            providerTransactionId: paymentIntentId,
          },
        },
        lastError: 'Conferma ordine Odoo fallita dopo pagamento Stripe',
      })
      await writeStructuredIntegrationLog({
        service: 'stripe',
        operation: 'checkout_finalize',
        correlationId: ctx.correlationId,
        success: false,
        orderId: order.id,
        odooSaleOrderId: saleOrderId ?? undefined,
        error: 'Conferma ordine Odoo fallita dopo pagamento Stripe',
        extra: { step: 'funnel_sync', sessionId: session.id },
      })
      await prisma.webhookEvent.create({
        data: {
          source: 'stripe',
          eventName: 'checkout.session.completed',
          externalId: `session:${session.id}`,
          processed: true,
          processedAt: new Date(),
          result: 'payment_verify_failed:ODOO_API_CONFLICT',
          payloadRedacted: { sessionId: session.id } as object,
        },
      })
      throw amountConflict
    }
    odooRegisterSynced = funnelResult.status === 'synced'
  }

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
      orderStatus: odooRegisterSynced ? 'SYNCED' : 'PAID',
      paymentStatus: 'CAPTURED',
      paymentMethod: 'STRIPE',
      providerTransactionId: paymentIntentId,
      paidAt: new Date(),
      lastPaymentError: null,
      ...(odooSaleOrderId != null ? { odooSaleOrderId } : {}),
      ...(odooRegisterSynced
        ? { odooLastSyncAt: new Date(), odooLastSyncStatus: 'SYNCED' }
        : {}),
      ...(req.sessionRecord?.user?.id && !order.odooPartnerId
        ? { odooPartnerId: req.sessionRecord.odooPartnerId }
        : {}),
    },
  })

  await prisma.cart.update({
    where: { id: updated.cartId },
    data: { status: 'CONVERTED', convertedOrderId: updated.id },
  })

  await orderTransactionalMail.notifyPaidCustomer(updated, req.correlationId ?? 'stripe-finalize')

  if (env.ODOO_ENABLED && !saleOrderId) {
    await prisma.pwaOrder.update({
      where: { id: updated.id },
      data: { orderStatus: 'PAID_SYNC_PENDING', odooLastSyncStatus: 'FAILED' },
    })
    await enqueueOrderOdooSaga(updated.id, {
      includeMail: false,
      lastError: 'Pagato in locale senza sale.order Odoo.',
    })
  }

  if (updated.odooPartnerId && saleOrderId) {
    let portalUrl: string | null = null
    try {
      const urlResult = await paymentUrlAdapter.createPortalPaymentUrl(ctx, {
        documentModel: 'sale.order',
        documentId: saleOrderId,
      })
      portalUrl = urlResult.paymentUrl
    } catch {
      /* optional */
    }
    await prisma.orderCache.upsert({
      where: { id: `pwa-${updated.id}` },
      create: {
        id: `pwa-${updated.id}`,
        odooPartnerId: updated.odooPartnerId,
        odooSaleOrderId: saleOrderId,
        status: 'sale',
        paymentStatus: 'paid',
        currencyCode: updated.currencyCode,
        totalAmount: updated.amountTotal,
        snapshotJson: {
          pwaOrderId: updated.id,
          odooPortalUrl: portalUrl,
          ...(updated.odooSaleOrderName ? { odooSaleOrderName: updated.odooSaleOrderName } : {}),
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
          ...(updated.odooSaleOrderName ? { odooSaleOrderName: updated.odooSaleOrderName } : {}),
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

  await writeStructuredIntegrationLog({
    service: 'stripe',
    operation: 'checkout_finalize',
    correlationId: ctx.correlationId,
    success: updated.orderStatus !== 'PAID_SYNC_PENDING',
    orderId: updated.id,
    odooSaleOrderId: saleOrderId ?? undefined,
    extra: {
      sessionId: session.id,
      paymentIntentId,
      orderStatus: updated.orderStatus,
      odooSyncStatus: updated.odooLastSyncStatus,
    },
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
    if (!session.id) return
    try {
      await finalizeStripeCheckout(req, session.id)
    } catch (e) {
      if (isAppError(e) && !e.retriable) {
        logger.warn('stripe.webhook.payment_verify_failed', {
          sessionId: session.id,
          code: e.code,
          correlationId: req.correlationId,
        })
        return
      }
      throw e
    }
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
