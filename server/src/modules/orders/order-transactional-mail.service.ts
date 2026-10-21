import type { PwaOrder } from '@prisma/client'
import { env } from '../../config/env.js'
import { prisma } from '../../lib/prisma.js'
import { logger } from '../../lib/logger.js'
import { publicAppUrl } from '../../lib/mail.js'
import { sendPwaMail, type PwaMailRecordRef } from '../../adapters/odoo/odooMailAdapter.js'
import { isOdooConfigured, type OdooCallContext } from '../../adapters/odoo/odooClient.js'
import { escapeMailHtml } from '../../adapters/odoo/odoo-mail.templates.js'
import { finalizeGuestAccountForOrder } from '../auth/guest-account.service.js'
import { formatDisplayOrderNumber } from './order-display-number.js'
import { accountOrderPublicId } from './orders-account-id.js'

type MailFlag = 'orderConfirmation' | 'shipment' | 'abandoned'

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

function orderUrl(order: Pick<PwaOrder, 'id' | 'odooSaleOrderName'>): string {
  return publicAppUrl(`/account/orders/${accountOrderPublicId(order)}`)
}

function formatAmount(cents: number | null | undefined, currency = 'EUR'): string {
  if (cents == null) return '-'
  const value = (cents / 100).toFixed(2)
  return currency.toUpperCase() === 'EUR' ? `€ ${value}` : `${value} ${currency}`
}

/** Collegamento chatter Odoo sull'ordine di vendita, se già sincronizzato. */
function saleOrderRecord(order: Pick<PwaOrder, 'odooSaleOrderId'>): PwaMailRecordRef | undefined {
  const resId = order.odooSaleOrderId
  if (resId == null || resId <= 0) return undefined
  return { model: 'sale.order', resId }
}

/**
 * Con Odoo attivo senza sale.order ancora: non inviare subito.
 * La saga `send_mail` riproverà dopo `ensure_sale_order`, così la mail compare nel chatter.
 */
function shouldDeferOrderConfirmation(order: Pick<PwaOrder, 'odooSaleOrderId'>): boolean {
  return Boolean(env.ODOO_ENABLED && isOdooConfigured() && !saleOrderRecord(order))
}

export const orderTransactionalMail = {
  async sendOrderConfirmation(order: PwaOrder, correlationId: string): Promise<void> {
    // Sempre i template [PWA] Idea di Luce (anche con API v2): la conferma nativa Odoo
    // punta al portale Odoo/WordPress e non va usata come mail cliente.
    if (alreadySent(order, 'orderConfirmation')) return
    if (shouldDeferOrderConfirmation(order)) {
      logger.info('order_mail.confirmation_deferred', {
        orderId: order.id,
        reason: 'sale.order assente: attesa sync Odoo per collegare la mail al chatter',
      })
      return
    }
    try {
      await sendPwaMail(mailCtx(correlationId), {
        templateKey: 'order_confirmation',
        emailTo: order.email,
        record: saleOrderRecord(order),
        vars: {
          first_name_suffix: firstNameSuffix(order.shippingAddressJson),
          order_number: formatDisplayOrderNumber(order),
          amount: formatAmount(order.amountTotal, order.currencyCode),
          order_url: orderUrl(order),
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
        record: saleOrderRecord(order),
        vars: {
          first_name_suffix: firstNameSuffix(order.shippingAddressJson),
          order_number: formatDisplayOrderNumber(order),
          carrier_line: input.carrierLabel ? ` con ${input.carrierLabel}` : '',
          tracking_html: trackingHtml,
          order_url: orderUrl(order),
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
        record: saleOrderRecord(order),
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
