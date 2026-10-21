import { env } from '../../config/env.js'
import type { CartWeightInput, ShippingAddressInput, ShippingQuoteLine } from './types.js'
import { fetchDhlRates } from './dhlClient.js'

/** Solo tariffe live: senza risposta DHL il corriere non compare (niente stime inventate). */
export async function fetchDhlLiveRates(
  address: ShippingAddressInput,
  weight: CartWeightInput,
  correlationId?: string,
): Promise<ShippingQuoteLine[]> {
  if (!env.DHL_ENABLED) return []
  return fetchDhlRates(address, weight, correlationId)
}
