import { env } from '../../config/env.js'
import { logger } from '../../lib/logger.js'
import { odooExecuteKw, type OdooCallContext } from './odooClient.js'

export type OdooFunnelState = {
  pwaOrderId: string
  orderStatus: string
  paymentStatus: string
  paymentMethod?: string | null
  cartId?: string | null
  sessionId?: string | null
  abandonedAt?: Date | null
  lastPaymentError?: string | null
  providerTransactionId?: string | null
}

let saleOrderFieldsCache: Set<string> | null = null

async function saleOrderFields(ctx: OdooCallContext): Promise<Set<string>> {
  if (saleOrderFieldsCache) return saleOrderFieldsCache
  const fields = await odooExecuteKw<Record<string, unknown>>(
    ctx,
    'sale.order',
    'fields_get',
    [],
    { attributes: ['string'] },
  )
  saleOrderFieldsCache = new Set(Object.keys(fields))
  return saleOrderFieldsCache
}

function isoOrNull(v: Date | null | undefined): string | null {
  return v ? v.toISOString() : null
}

export async function syncSaleOrderFunnelState(
  ctx: OdooCallContext,
  saleOrderId: number | null | undefined,
  state: OdooFunnelState,
): Promise<'skipped' | 'synced' | 'failed'> {
  if (!env.ODOO_ENABLED || !saleOrderId) return 'skipped'

  try {
    const fields = await saleOrderFields(ctx)
    const vals: Record<string, unknown> = {}

    const custom: Record<string, unknown> = {
      x_pwa_checkout_status: state.orderStatus,
      x_pwa_payment_status: state.paymentStatus,
      x_pwa_payment_method: state.paymentMethod ?? false,
      x_pwa_cart_token: state.cartId ?? false,
      x_pwa_session_id: state.sessionId ?? false,
      x_pwa_abandoned_at: isoOrNull(state.abandonedAt) ?? false,
      x_pwa_last_payment_error: state.lastPaymentError ?? false,
      x_pwa_provider_transaction_id: state.providerTransactionId ?? false,
    }

    for (const [field, value] of Object.entries(custom)) {
      if (fields.has(field)) vals[field] = value
    }

    if (fields.has('client_order_ref')) {
      vals.client_order_ref = `PWA ${state.pwaOrderId}`
    }

    if (Object.keys(vals).length > 0) {
      await odooExecuteKw<boolean>(ctx, 'sale.order', 'write', [[saleOrderId], vals], {})
    }

    if (state.orderStatus === 'paid' || state.paymentStatus === 'captured') {
      try {
        await odooExecuteKw<unknown>(ctx, 'sale.order', 'action_confirm', [[saleOrderId]], {})
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        if (!msg.includes('cannot marshal None unless allow_none is enabled')) throw e
      }
    }

    return 'synced'
  } catch (e) {
    logger.warn(
      'odoo.funnel_sync_failed',
      { saleOrderId, pwaOrderId: state.pwaOrderId, err: String(e) },
      ctx.req,
    )
    return 'failed'
  }
}

