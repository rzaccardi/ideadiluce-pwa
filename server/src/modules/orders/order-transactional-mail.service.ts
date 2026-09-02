import type { PwaOrder } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import { logger } from '../../lib/logger.js'
import { publicAppUrl } from '../../lib/mail.js'
import { sendPwaMail } from '../../adapters/odoo/odooMailAdapter.js'
import type { OdooCallContext } from '../../adapters/odoo/odooClient.js'
import { escapeMailHtml } from '../../adapters/odoo/odoo-mail.templates.js'
import { parseBankTransferInstructionsJson } from '../payments/bankTransferInstructions.js'
import { finalizeGuestAccountForOrder } from '../auth/guest-account.service.js'

type MailFlag = 'orderConfirmation' | 'bankTransfer' | 'shipment' | 'abandoned'

type OrderMailMeta = {
  pwaMail?: Partial<Record<`${MailFlag}SentAt`, string>>
}

function mailCtx(correlationId: string): OdooCallContext {
  return { correlationId }
}

function metaOf(order: { metadataJson: unknown }): OrderMailMeta {
  return order.metadataJson && typeof order.metadataJson === 'object'
    ? (order.metadataJson as OrderMailMeta)
    : {}
}

function alreadySent(order: { metadataJson: unknown }, flag: MailFlag): boolean {
  return Boolean(metaOf(order).pwaMail?.[`${flag}SentAt`])
}

async function markSent(orderId: string, flag: MailFlag): Promise<void> {
  const current = await prisma.pwaOrder.findUnique({
    where: { id: orderId },
    select: { metadataJson: true },
  })
  const meta = metaOf({ metadataJson: current?.metadataJson })
  await prisma.pwaOrder.update({
    where: { id: orderId },
    data: {
      metadataJson: {
        ...meta,
        pwaMail: {
          ...(meta.pwaMail ?? {}),
          [`${flag}SentAt`]: new Date().toISOString(),
        },
      },
    },
  })
}

function safeHttpUrl(raw: string): string | null {
  try {
    const parsed = new URL(raw.trim())
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return parsed.toString()
  } catch {
    /* ignore */
  }
  return null
}

function firstNameSuffix(shippingJson: unknown): string {
  if (!shippingJson || typeof shippingJson !== 'object') return ''
  const name = (shippingJson as { firstName?: unknown }).firstName
  return typeof name === 'string' && name.trim() ? ` ${name.trim()}` : ''
}

function orderNumber(order: Pick<PwaOrder, 'id' | 'odooSaleOrderId'>): string {
  const year = new Date().getFullYear()
  if (order.odooSaleOrderId != null) {
    return `#IDL-${year}-${String(order.odooSaleOrderId).padStart(5, '0')}`
  }
  return `#${order.id.slice(0, 8).toUpperCase()}`
}

function formatAmount(cents: number | null | undefined, currency = 'EUR'): string {
  if (cents == null) return '—'
  const value = (cents / 100).toFixed(2)
  return currency.toUpperCase() === 'EUR' ? `€ ${value}` : `${value} ${currency}`
}

function orderUrl(orderId: string): string {
  return publicAppUrl(`/checkout/result/${orderId}`)
}

export const orderTransactionalMail = {
  async sendOrderConfirmation(order: PwaOrder, correlationId: string): Promise<void> {
    if (alreadySent(order, 'orderConfirmation')) return
    try {
      await sendPwaMail(mailCtx(correlationId), {
        templateKey: 'order_confirmation',
        emailTo: order.email,
        vars: {
          first_name_suffix: firstNameSuffix(order.shippingAddressJson),
          order_number: orderNumber(order),
          amount: formatAmount(order.amountTotal, order.currencyCode),
          order_url: orderUrl(order.id),
        },
      })
      await markSent(order.id, 'orderConfirmation')
    } catch (e) {
      logger.warn('order_mail.confirmation_failed', {
        orderId: order.id,
        error: e instanceof Error ? e.message : String(e),
      })
    }
  },

  async sendBankTransferInstructions(order: PwaOrder, correlationId: string): Promise<void> {
    if (alreadySent(order, 'bankTransfer')) return
    const payment = await prisma.pwaPayment.findFirst({
      where: { orderId: order.id, method: 'BANK_TRANSFER' },
      orderBy: { createdAt: 'desc' },
    })
    const instructions = parseBankTransferInstructionsJson(payment?.instructionsJson)
    if (!instructions) return
    try {
      await sendPwaMail(mailCtx(correlationId), {
        templateKey: 'bank_transfer_pending',
        emailTo: order.email,
        vars: {
          first_name_suffix: firstNameSuffix(order.shippingAddressJson),
          order_number: orderNumber(order),
          holder: instructions.holder,
          iban: instructions.iban,
          bank_name_html: instructions.bankName
            ? `<br/>Banca: ${escapeMailHtml(instructions.bankName)}`
            : '',
          reference: instructions.reference,
          amount: formatAmount(instructions.amount, instructions.currencyCode),
          note: instructions.note,
          order_url: orderUrl(order.id),
        },
      })
      await markSent(order.id, 'bankTransfer')
    } catch (e) {
      logger.warn('order_mail.bank_transfer_failed', {
        orderId: order.id,
        error: e instanceof Error ? e.message : String(e),
      })
    }
  },

  async sendShipmentNotice(
    order: PwaOrder,
    input: { carrierLabel: string | null; trackingNumber: string | null; trackingUrl: string | null },
    correlationId: string,
  ): Promise<void> {
    if (!input.trackingNumber && !input.trackingUrl) return
    if (alreadySent(order, 'shipment')) return
    const trackingHref = input.trackingUrl ? safeHttpUrl(input.trackingUrl) : null
    const trackingLabel = escapeMailHtml(input.trackingNumber || trackingHref || '')
    const trackingHtml = trackingHref
      ? `Tracking: <a href="${escapeMailHtml(trackingHref)}">${trackingLabel}</a>`
      : trackingLabel
        ? `Tracking: ${trackingLabel}`
        : ''
    try {
      await sendPwaMail(mailCtx(correlationId), {
        templateKey: 'order_shipped',
        emailTo: order.email,
        vars: {
          first_name_suffix: firstNameSuffix(order.shippingAddressJson),
          order_number: orderNumber(order),
          carrier_line: input.carrierLabel ? ` con ${input.carrierLabel}` : '',
          tracking_html: trackingHtml,
          order_url: orderUrl(order.id),
        },
      })
      await markSent(order.id, 'shipment')
    } catch (e) {
      logger.warn('order_mail.shipment_failed', {
        orderId: order.id,
        error: e instanceof Error ? e.message : String(e),
      })
    }
  },

  async sendAbandonedCartReminder(order: PwaOrder, correlationId: string): Promise<void> {
    if (!order.email?.includes('@')) return
    if (alreadySent(order, 'abandoned')) return
    try {
      await sendPwaMail(mailCtx(correlationId), {
        templateKey: 'abandoned_cart',
        emailTo: order.email,
        vars: {
          first_name_suffix: firstNameSuffix(order.shippingAddressJson),
          cart_url: publicAppUrl('/cart'),
        },
      })
      await markSent(order.id, 'abandoned')
    } catch (e) {
      logger.warn('order_mail.abandoned_failed', {
        orderId: order.id,
        error: e instanceof Error ? e.message : String(e),
      })
    }
  },

  /** Conferma ordine + account ospite se richiesto. Idempotente. */
  async notifyPaidCustomer(order: PwaOrder, correlationId: string): Promise<void> {
    await this.sendOrderConfirmation(order, correlationId)
    try {
      await finalizeGuestAccountForOrder(order.id)
    } catch (e) {
      logger.warn('order_mail.guest_account_failed', {
        orderId: order.id,
        error: e instanceof Error ? e.message : String(e),
      })
    }
  },
}
