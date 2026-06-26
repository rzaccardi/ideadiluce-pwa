import type { Request } from 'express'
import { env } from '../config/env.js'
import { writeIntegrationLog } from './integration-log.js'
import { AppError } from '../types/errors.js'
import {
  isOdooConfigured,
  odooXmlRpcVersion,
  type OdooCallContext,
} from '../adapters/odoo/odooClient.js'

export type OdooCheckoutHealthMeta = {
  userId?: string | null
  cartId?: string | null
  orderId?: string | null
  step: string
}

export async function assertOdooReadyForCheckout(
  ctx: OdooCallContext,
  meta: OdooCheckoutHealthMeta,
): Promise<void> {
  if (!env.ODOO_ENABLED || !isOdooConfigured()) return

  const startedAt = new Date()
  try {
    await odooXmlRpcVersion(ctx)
  } catch (e) {
    const finishedAt = new Date()
    const message = e instanceof Error ? e.message : String(e)
    void writeIntegrationLog({
      service: 'odoo',
      operation: 'checkout_health',
      correlationId: ctx.correlationId,
      success: false,
      statusCode: 503,
      requestRedacted: {
        step: meta.step,
        userId: meta.userId ?? null,
        cartId: meta.cartId ?? null,
        orderId: meta.orderId ?? null,
      },
      responseRedacted: { message },
      startedAt,
      finishedAt,
    })
    throw new AppError(
      'ODOO_UNAVAILABLE',
      'Odoo unavailable',
      'Il sistema ordini non è momentaneamente disponibile. Riprova tra qualche minuto.',
      503,
      true,
    )
  }
}

export async function assertOdooReadyForCheckoutFromRequest(
  req: Request,
  meta: OdooCheckoutHealthMeta,
): Promise<void> {
  await assertOdooReadyForCheckout({ correlationId: req.correlationId, req }, meta)
}
