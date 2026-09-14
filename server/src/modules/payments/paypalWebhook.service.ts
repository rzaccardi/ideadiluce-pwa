import type { Request } from 'express'
import { prisma } from '../../lib/prisma.js'
import { logger } from '../../lib/logger.js'
import { registerPayment } from '../../adapters/odoo/odooPaymentLive.js'

const CAPTURE_COMPLETED = 'PAYMENT.CAPTURE.COMPLETED'

type PaypalResource = {
  id?: string
  status?: string
  custom_id?: string
  invoice_id?: string
  amount?: { value?: string; currency_code?: string }
  supplementary_data?: { related_ids?: { order_id?: string } }
}

export function pwaOrderIdFromPaypalCapture(resource: PaypalResource | null | undefined): string | null {
  if (!resource) return null
  const candidates = [
    resource.custom_id,
    resource.invoice_id,
    resource.supplementary_data?.related_ids?.order_id,
  ]
  for (const raw of candidates) {
    const value = raw?.trim()
    if (!value) continue
    if (value.startsWith('pwa-')) return value.slice(4)
    if (/^[A-Z0-9]{6}$/i.test(value)) return value
    if (value.length >= 8) return value
  }
  return null
}

function centsFromPaypalAmount(value: string | undefined): number | null {
  if (!value?.trim()) return null
  const n = Number(value)
  if (!Number.isFinite(n)) return null
  return Math.round(n * 100)
}

export async function handlePaypalWebhookEvent(
  req: Request,
): Promise<{ accepted: true; processed: boolean; orderId?: string }> {
  const body = (req.body ?? {}) as {
    id?: string
    event_type?: string
    resource?: PaypalResource
  }
  const eventType = body.event_type?.trim() || 'unknown'
  const eventId = body.id?.trim() || null
  const resource = body.resource

  if (eventId) {
    const existing = await prisma.webhookEvent.findFirst({
      where: { source: 'paypal', externalId: eventId, processed: true },
    })
    if (existing) {
      return { accepted: true, processed: false, orderId: undefined }
    }
  }

  if (eventType !== CAPTURE_COMPLETED) {
    if (eventId) {
      await prisma.webhookEvent.create({
        data: {
          source: 'paypal',
          eventName: eventType,
          externalId: eventId,
          processed: true,
          processedAt: new Date(),
          result: 'ignored',
        },
      })
    }
    return { accepted: true, processed: false }
  }

  const lookup = pwaOrderIdFromPaypalCapture(resource)
  const captureId = resource?.id?.trim() || eventId
  if (!lookup) {
    logger.warn('paypal.webhook.order_not_resolved', { eventId, eventType, captureId })
    return { accepted: true, processed: false }
  }

  const order = await prisma.pwaOrder.findFirst({
    where: {
      OR: [
        { id: lookup },
        { odooSaleOrderName: { equals: lookup, mode: 'insensitive' } },
        { clientOrderRef: lookup },
        { clientOrderRef: `pwa-${lookup}` },
      ],
    },
    include: { payments: { orderBy: { createdAt: 'desc' }, take: 1 } },
  })

  if (!order) {
    logger.warn('paypal.webhook.order_missing', { lookup, eventId })
    return { accepted: true, processed: false }
  }

  const amountCents = centsFromPaypalAmount(resource?.amount?.value) ?? order.amountTotal
  const payment = order.payments[0]
  if (payment) {
    await prisma.pwaPayment.update({
      where: { id: payment.id },
      data: {
        status: 'CAPTURED',
        provider: 'paypal',
        providerTransactionId: captureId,
        capturedAt: new Date(),
      },
    })
  }

  const alreadyPaid = ['PAID', 'PAID_SYNC_PENDING', 'SYNCED', 'CONFIRMED', 'COMPLETED'].includes(
    order.orderStatus,
  )
  const updated = alreadyPaid
    ? order
    : await prisma.pwaOrder.update({
        where: { id: order.id },
        data: {
          orderStatus: 'PAID',
          paymentStatus: 'CAPTURED',
          paidAt: order.paidAt ?? new Date(),
          lastPaymentError: null,
        },
      })

  if (updated.odooSaleOrderId) {
    await registerPayment(
      { correlationId: req.correlationId ?? `paypal:${captureId ?? updated.id}` },
      {
        saleOrderId: updated.odooSaleOrderId,
        pwaOrderId: updated.id,
        method: 'paypal',
        amountCents: amountCents ?? updated.amountTotal ?? 0,
        transactionId: captureId ?? updated.id,
        status: 'captured',
      },
    )
  }

  if (eventId) {
    await prisma.webhookEvent.create({
      data: {
        source: 'paypal',
        eventName: eventType,
        externalId: eventId,
        processed: true,
        processedAt: new Date(),
        result: 'ok',
        payloadRedacted: { captureId, orderId: updated.id } as object,
      },
    })
  }

  return { accepted: true, processed: true, orderId: updated.id }
}
