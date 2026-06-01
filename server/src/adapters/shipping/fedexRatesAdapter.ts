import { env } from '../../config/env.js'
import type { CartWeightInput, ShippingAddressInput, ShippingQuoteLine } from './types.js'
import { fetchFedexRates } from './fedexClient.js'

export async function fetchFedexLiveRates(
  address: ShippingAddressInput,
  weight: CartWeightInput,
): Promise<ShippingQuoteLine[]> {
  if (!env.FEDEX_ENABLED) return []
  const live = await fetchFedexRates(address, weight)
  if (live.length > 0) return live

  if (!env.FEDEX_CLIENT_ID?.trim()) return []
  const baseCents = Math.max(1400, Math.round(weight.totalWeightKg * 500 + 900))
  return [
    {
      methodRef: 'live_fedex:FEDEX_INTERNATIONAL_PRIORITY',
      carrierCode: 'fedex',
      serviceCode: 'FEDEX_INTERNATIONAL_PRIORITY',
      label: 'FedEx International Priority (stima)',
      amountCents: baseCents,
      currencyCode: 'EUR',
      etaDays: 3,
      source: 'fedex',
    },
  ]
}
