import { env } from '../../config/env.js'
import type { CartWeightInput, ShippingAddressInput, ShippingQuoteLine } from './types.js'
import { fetchFedexRates } from './fedexClient.js'

/** Solo tariffe live: senza risposta FedEx il corriere non compare (niente stime inventate). */
export async function fetchFedexLiveRates(
  address: ShippingAddressInput,
  weight: CartWeightInput,
  correlationId?: string,
): Promise<ShippingQuoteLine[]> {
  if (!env.FEDEX_ENABLED) return []
  return fetchFedexRates(address, weight, correlationId)
}
