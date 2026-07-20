import { authStore } from '@/features/auth'

/** Opzioni listino/partner Odoo per chiamate catalogo Odoo (utente autenticato). */
export function getCatalogPricingOptions(): {
  partnerId?: number
  pricelistId?: number
} {
  const me = authStore.me
  if (!me) return {}

  const partnerId =
    me.odooPartnerId != null && me.odooPartnerId > 0 ? me.odooPartnerId : undefined
  const pricelistId =
    me.odooPricelistId != null && me.odooPricelistId > 0 ? me.odooPricelistId : undefined

  if (partnerId == null && pricelistId == null) return {}
  return { partnerId, pricelistId }
}
