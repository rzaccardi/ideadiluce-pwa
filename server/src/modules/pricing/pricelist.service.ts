import type { Request } from 'express'
import type { CustomerSegment } from '@prisma/client'
import { env } from '../../config/env.js'
import { prisma } from '../../lib/prisma.js'
import { isOdooConfigured, odooExecuteKw, type OdooCallContext } from '../../adapters/odoo/odooClient.js'

export type PricingContext = {
  segment: CustomerSegment
  pricelistId: number | null
  partnerId: number | null
  /** True se i prezzi devono seguire il listino della sessione (B2B/pro/partner), non il pubblico. */
  personalized?: boolean
}

export function envPricelistForSegment(segment: CustomerSegment): number | null {
  const raw =
    segment === 'BUSINESS'
      ? env.ODOO_PRICELIST_B2B_ID
      : segment === 'PROFESSIONAL'
        ? env.ODOO_PRICELIST_PROFESSIONAL_ID ?? env.ODOO_PRICELIST_B2C_ID
        : env.ODOO_PRICELIST_B2C_ID
  return raw != null && raw > 0 ? raw : null
}

export function isPersonalizedPricing(pricing?: PricingContext | null): boolean {
  if (!pricing) return false
  if (pricing.personalized != null) return pricing.personalized
  return (
    pricing.partnerId != null ||
    pricing.segment === 'BUSINESS' ||
    pricing.segment === 'PROFESSIONAL'
  )
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

export async function resolveAccountPricing(options: {
  segment: CustomerSegment
  odooPricelistId?: number | null
  partnerId?: number | null
  skipOdoo?: boolean
  correlationId?: string
}): Promise<PricingContext> {
  const segment = options.segment
  const partnerId = options.partnerId != null && options.partnerId > 0 ? options.partnerId : null
  const userPricelist =
    options.odooPricelistId != null && options.odooPricelistId > 0 ? options.odooPricelistId : null

  let pricelistId = userPricelist
  if (pricelistId == null && partnerId != null && !options.skipOdoo) {
    const fromPartner = await partnerPricelistId(
      { correlationId: options.correlationId ?? 'pricelist' },
      partnerId,
    )
    if (fromPartner != null) pricelistId = fromPartner
  }
  if (pricelistId == null) {
    pricelistId = envPricelistForSegment(segment)
  }

  const personalized = Boolean(
    segment === 'BUSINESS' ||
      segment === 'PROFESSIONAL' ||
      userPricelist != null ||
      partnerId != null,
  )

  return { segment, pricelistId, partnerId, personalized }
}

export async function resolvePricingContext(
  req: Request,
  options?: { skipOdoo?: boolean },
): Promise<PricingContext> {
  const user = req.sessionRecord?.user
  if (!user) {
    return {
      segment: 'RETAIL',
      pricelistId: envPricelistForSegment('RETAIL'),
      partnerId: null,
      personalized: false,
    }
  }

  const map = await prisma.odooCustomerMap.findUnique({ where: { userId: user.id } })
  return resolveAccountPricing({
    segment: user.customerSegment,
    odooPricelistId: user.odooPricelistId,
    partnerId: map?.odooPartnerId ?? null,
    skipOdoo: options?.skipOdoo,
    correlationId: req.correlationId,
  })
}

export function pricingContextLabel(segment: CustomerSegment): string {
  if (segment === 'BUSINESS') return 'Listino business'
  if (segment === 'PROFESSIONAL') return 'Condizioni professional'
  return 'Listino retail'
}
