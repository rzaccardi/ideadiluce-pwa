import { prisma } from '../../lib/prisma.js'
import { env } from '../../config/env.js'
import { logger } from '../../lib/logger.js'
import { sendMail } from '../../lib/mail.js'
import { writeStructuredIntegrationLog } from '../../lib/integration-log-context.js'

export type PaidSyncPendingSummary = {
  count: number
  items: Array<{
    id: string
    email: string
    amountTotal: number | null
    paidAt: string | null
    odooSaleOrderId: number | null
    lastPaymentError: string | null
    odooLastSyncStatus: string
    paidSyncAlertSentAt: string | null
  }>
}

function alertThresholdDate(): Date {
  const minutes = Math.max(1, env.PAID_SYNC_ALERT_MINUTES)
  return new Date(Date.now() - minutes * 60_000)
}

export const paidSyncAlertService = {
  async listPendingForAdmin(limit = 20): Promise<PaidSyncPendingSummary> {
    const rows = await prisma.pwaOrder.findMany({
      where: { orderStatus: 'PAID_SYNC_PENDING' },
      orderBy: { paidAt: 'asc' },
      take: limit,
      select: {
        id: true,
        email: true,
        amountTotal: true,
        paidAt: true,
        odooSaleOrderId: true,
        lastPaymentError: true,
        odooLastSyncStatus: true,
        paidSyncAlertSentAt: true,
      },
    })
    return {
      count: await prisma.pwaOrder.count({ where: { orderStatus: 'PAID_SYNC_PENDING' } }),
      items: rows.map((r) => ({
        id: r.id,
        email: r.email,
        amountTotal: r.amountTotal,
        paidAt: r.paidAt?.toISOString() ?? null,
        odooSaleOrderId: r.odooSaleOrderId,
        lastPaymentError: r.lastPaymentError,
        odooLastSyncStatus: r.odooLastSyncStatus,
        paidSyncAlertSentAt: r.paidSyncAlertSentAt?.toISOString() ?? null,
      })),
    }
  },

  /**
   * Invia email admin per ordini PAID_SYNC_PENDING oltre soglia (una sola volta per ordine).
   * Logga esplicitamente: inviato / email non configurata / errore SMTP.
   */
  async processDueAlerts(): Promise<{ sent: number; skipped: number; failed: number }> {
    const threshold = alertThresholdDate()
    const emailTo = env.PAID_SYNC_ALERT_EMAIL?.trim()

    const due = await prisma.pwaOrder.findMany({
      where: {
        orderStatus: 'PAID_SYNC_PENDING',
        paidAt: { not: null, lte: threshold },
        paidSyncAlertSentAt: null,
      },
      orderBy: { paidAt: 'asc' },
      take: 50,
    })

    if (due.length === 0) {
      return { sent: 0, skipped: 0, failed: 0 }
    }

    if (!emailTo) {
      logger.warn('paid_sync_alert.email_not_configured', {
        pendingCount: due.length,
        orderIds: due.map((o) => o.id),
        hint: 'Imposta PAID_SYNC_ALERT_EMAIL per ricevere email automatiche',
      })
      for (const order of due) {
        await writeStructuredIntegrationLog({
          service: 'orders',
          operation: 'paid_sync_alert_skipped',
          correlationId: `paid-sync-${order.id}`,
          success: false,
          orderId: order.id,
          odooSaleOrderId: order.odooSaleOrderId ?? undefined,
          error: 'PAID_SYNC_ALERT_EMAIL non configurata',
        })
      }
      return { sent: 0, skipped: due.length, failed: 0 }
    }

    let sent = 0
    let failed = 0

    for (const order of due) {
      const adminUrl = `${env.ADMIN_ORIGIN.replace(/\/$/, '')}/orders/${order.id}`
      const amount =
        order.amountTotal != null ? `€ ${(order.amountTotal / 100).toFixed(2)}` : 'n/d'
      const subject = `[Idea di Luce] Ordine pagato — sync Odoo in attesa (${order.id.slice(-8)})`
      const text = [
        'Un ordine risulta pagato ma la sincronizzazione Odoo non è completata.',
        '',
        `Ordine PWA: ${order.id}`,
        `Cliente: ${order.email}`,
        `Importo: ${amount}`,
        `Pagato il: ${order.paidAt?.toISOString() ?? 'n/d'}`,
        `Odoo sale.order: ${order.odooSaleOrderId ?? 'non collegato'}`,
        `Ultimo errore: ${order.lastPaymentError ?? '—'}`,
        `Stato sync: ${order.odooLastSyncStatus}`,
        '',
        `Apri in backoffice: ${adminUrl}`,
        '',
        'Verifica la coda sync Odoo e usa «Riprova sync» se necessario.',
      ].join('\n')

      try {
        await sendMail({ to: emailTo, subject, text })
        await prisma.pwaOrder.update({
          where: { id: order.id },
          data: { paidSyncAlertSentAt: new Date() },
        })
        await writeStructuredIntegrationLog({
          service: 'orders',
          operation: 'paid_sync_alert_sent',
          correlationId: `paid-sync-${order.id}`,
          success: true,
          orderId: order.id,
          odooSaleOrderId: order.odooSaleOrderId ?? undefined,
          extra: { emailTo },
        })
        sent += 1
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        logger.error('paid_sync_alert.send_failed', { orderId: order.id, error: msg })
        await writeStructuredIntegrationLog({
          service: 'orders',
          operation: 'paid_sync_alert_failed',
          correlationId: `paid-sync-${order.id}`,
          success: false,
          orderId: order.id,
          odooSaleOrderId: order.odooSaleOrderId ?? undefined,
          error: msg,
        })
        failed += 1
      }
    }

    return { sent, skipped: 0, failed }
  },
}
