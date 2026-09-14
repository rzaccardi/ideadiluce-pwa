import { prisma } from '../../lib/prisma.js'
import { env } from '../../config/env.js'
import { logger } from '../../lib/logger.js'
import { sendPwaMail, PWA_ADMIN_MAIL_TO } from '../odoo/odooMailAdapter.js'
import type { OdooCallContext } from '../odoo/odooClient.js'
import { OdooApiV2Error } from './odooApiClient.js'
import type { OdooApiPaymentResult } from './odooApi.types.js'

export async function alertOdooPaymentConflict(input: {
  ctx: OdooCallContext
  pwaOrderId: string
  odooSaleOrderId: number
  odooSaleOrderName?: string | null
  amountCents: number
  error: OdooApiV2Error
}): Promise<void> {
  const emailTo = env.PAID_SYNC_ALERT_EMAIL?.trim() || PWA_ADMIN_MAIL_TO
  const body = input.error.body
  const rec = body && typeof body === 'object' ? (body as { reconciliation?: unknown }) : null
  logger.error('odoo.api_v2.payment_conflict', {
    pwaOrderId: input.pwaOrderId,
    odooSaleOrderId: input.odooSaleOrderId,
    amountCents: input.amountCents,
    error: input.error.message,
    reconciliation: rec?.reconciliation ?? null,
  })
  try {
    await sendPwaMail(input.ctx, {
      templateKey: 'paid_sync_alert_admin',
      emailTo,
      vars: {
        order_short: input.pwaOrderId.slice(-8),
        body_text: [
          'POST /api/v2/orders/<id>/payments ha risposto 409 (importo diverso dal totale Odoo).',
          '',
          `Ordine PWA: ${input.pwaOrderId}`,
          `Odoo: ${input.odooSaleOrderName || input.odooSaleOrderId}`,
          `Importo inviato (centesimi): ${input.amountCents}`,
          `Errore: ${input.error.message}`,
        ].join('\n'),
      },
    })
  } catch (e) {
    logger.warn('odoo.api_v2.payment_conflict_mail_failed', {
      error: e instanceof Error ? e.message : String(e),
    })
  }
}

export async function persistOdooOrderLink(
  pwaOrderId: string,
  result: {
    odooSaleOrderId: number
    odooSaleOrderName?: string | null
    odooShippingAddressId?: number | null
    odooInvoiceAddressId?: number | null
    odooPartnerId?: number | null
  },
): Promise<void> {
  await prisma.pwaOrder.update({
    where: { id: pwaOrderId },
    data: {
      odooSaleOrderId: result.odooSaleOrderId,
      ...(result.odooSaleOrderName ? { odooSaleOrderName: result.odooSaleOrderName } : {}),
      ...(result.odooShippingAddressId != null
        ? { odooShippingAddressId: result.odooShippingAddressId }
        : {}),
      ...(result.odooInvoiceAddressId != null ? { odooInvoiceAddressId: result.odooInvoiceAddressId } : {}),
      ...(result.odooPartnerId != null ? { odooPartnerId: result.odooPartnerId } : {}),
    },
  })
}

export function paymentResultOrderState(result: OdooApiPaymentResult): string | undefined {
  return result.order_state
}
