import type { Request } from 'express'
import { resolvePricingContext } from '../pricing/pricelist.service.js'

const CLIENT_PRICING_KEYS = ['partner_id', 'pricelist_id', 'website'] as const

/** Il client non può scegliere listino, partner Odoo o website. */
export function stripClientPricingParams(
  query: Record<string, string | undefined>,
): Record<string, string | undefined> {
  const sanitized = { ...query }
  for (const key of CLIENT_PRICING_KEYS) {
    delete sanitized[key]
  }
  return sanitized
}

/** Listino/partner solo dalla sessione autenticata, mai da query string. */
export async function catalogProxyPricingQuery(
  req: Request,
  query: Record<string, string | undefined>,
): Promise<Record<string, string | undefined>> {
  const pricing = await resolvePricingContext(req)
  const merged = stripClientPricingParams(query)
  if (pricing.partnerId != null) merged.partner_id = String(pricing.partnerId)
  if (pricing.pricelistId != null) merged.pricelist_id = String(pricing.pricelistId)
  return merged
}
