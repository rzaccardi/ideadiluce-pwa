import { env } from '../../config/env.js'
import type { CartWeightInput, ShippingAddressInput, ShippingQuoteLine } from './types.js'
import { fetchDhlRates } from './dhlClient.js'

export async function fetchDhlLiveRates(
  address: ShippingAddressInput,
  weight: CartWeightInput,
): Promise<ShippingQuoteLine[]> {
  if (!env.DHL_ENABLED) return []
  const live = await fetchDhlRates(address, weight)
  if (live.length > 0) return live

  if (!env.DHL_API_KEY?.trim()) return []
  const baseCents = Math.max(1200, Math.round(weight.totalWeightKg * 450 + 800))
  return [
    {
      methodRef: 'live_dhl:P',
      carrierCode: 'dhl',
      serviceCode: 'P',
      label: 'DHL Express Worldwide (stima)',
      amountCents: baseCents,
      currencyCode: 'EUR',
      etaDays: 2,
      source: 'dhl',
    },
  ]
}
