import { isEuCountry, normalizeCountryCode } from '../../modules/tax/tax.constants.js'
import type { ShippingQuoteLine } from './types.js'

/**
 * Servizi che vendiamo (Emil, go-live):
 * - DHL IT: Express Domestic (N); estero: Express Worldwide (P)
 * - FedEx IT: Priority; UE: Regional Economy; extra-UE: International Economy
 */
export function isSellableDhlService(country: string, productCode: string): boolean {
  const code = productCode.trim().toUpperCase()
  const dest = normalizeCountryCode(country)
  if (dest === 'IT') return code === 'N'
  return code === 'P'
}

const FEDEX_IT = new Set(['FEDEX_PRIORITY', 'PRIORITY_OVERNIGHT', 'FEDEX_PRIORITY_EXPRESS'])
const FEDEX_EU = new Set(['FEDEX_REGIONAL_ECONOMY', 'REGIONAL_ECONOMY'])
const FEDEX_EXTRA_EU = new Set([
  'FEDEX_INTERNATIONAL_ECONOMY',
  'INTERNATIONAL_ECONOMY',
  'INTERNATIONAL_ECONOMY_FREIGHT',
])

export function isSellableFedexService(country: string, serviceType: string): boolean {
  const code = serviceType.trim().toUpperCase()
  const dest = normalizeCountryCode(country)
  if (dest === 'IT') return FEDEX_IT.has(code)
  if (isEuCountry(dest)) return FEDEX_EU.has(code)
  return FEDEX_EXTRA_EU.has(code)
}

export function filterSellableCarrierQuotes(
  country: string,
  lines: ShippingQuoteLine[],
): ShippingQuoteLine[] {
  return lines.filter((line) => {
    if (line.carrierCode === 'dhl') {
      return isSellableDhlService(country, line.serviceCode)
    }
    if (line.carrierCode === 'fedex') {
      return isSellableFedexService(country, line.serviceCode)
    }
    return true
  })
}
