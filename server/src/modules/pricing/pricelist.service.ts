import type { Request } from 'express'
import type { CustomerSegment } from '@prisma/client'
import { env } from '../../config/env.js'
import { prisma } from '../../lib/prisma.js'
import { isOdooConfigured, odooExecuteKw, type OdooCallContext } from '../../adapters/odoo/odooClient.js'

export type PricingContext = {
  segment: CustomerSegment
  pricelistId: number | null
  partnerId: number | null
}

function envPricelistForSegment(segment: CustomerSegment): number | null {
  const raw =
    segment === 'BUSINESS'
      ? env.ODOO_PRICELIST_B2B_ID
      : segment === 'PROFESSIONAL'
        ? env.ODOO_PRICELIST_PROFESSIONAL_ID ?? env.ODOO_PRICELIST_B2C_ID
        : env.ODOO_PRICELIST_B2C_ID
  return raw != null && raw > 0 ? raw : null
}

async function partnerPricelistId(ctx: OdooCallContext, partnerId: number): Promise<number | null> {
  if (!env.ODOO_ENABLED || !isOdooConfigured()) return null
  try {
    const rows = await odooExecuteKw<Array<{ property_product_pricelist?: [number, string] | false }>>(
      ctx,
      'res.partner',
      'read',
      [[partnerId]],
      { fields: ['property_product_pricelist'] },
    )
    const pl = rows[0]?.property_product_pricelist
    if (Array.isArray(pl) && typeof pl[0] === 'number') return pl[0]
  } catch {
    /* partner senza listino o campo assente */
  }
  return null
}

export async function resolvePricingContext(req: Request): Promise<PricingContext> {
  const user = req.sessionRecord?.user
  let segment: CustomerSegment = 'RETAIL'
  let partnerId: number | null = null
  let pricelistId: number | null = null

  if (user) {
    segment = user.customerSegment
    if (user.odooPricelistId != null && user.odooPricelistId > 0) {
      pricelistId = user.odooPricelistId
    }
    const map = await prisma.odooCustomerMap.findUnique({ where: { userId: user.id } })
    if (map) partnerId = map.odooPartnerId
  }

  if (pricelistId == null) {
    pricelistId = envPricelistForSegment(segment)
  }
  if (pricelistId == null && partnerId != null) {
    const ctx: OdooCallContext = { correlationId: req.correlationId }
    const fromPartner = await partnerPricelistId(ctx, partnerId)
    if (fromPartner != null) pricelistId = fromPartner
  }

  return { segment, pricelistId, partnerId }
}

export function pricingContextLabel(segment: CustomerSegment): string {
  if (segment === 'BUSINESS') return 'Listino business'
  if (segment === 'PROFESSIONAL') return 'Condizioni professional'
  return 'Listino retail'
}
