import { formatStreetLine } from '@/lib/checkout-address.validators'
import type { AddressInput } from '@/types/integrations'
import { getAddressAutocompleteProvider } from './index'
import type { ResolvedAddress } from './types'

type PrefillAddress = Pick<
  AddressInput,
  'line1' | 'streetNumber' | 'isSnc' | 'line2' | 'city' | 'postalCode' | 'country'
>

export function buildAddressGeocodeQuery(address: PrefillAddress): string | null {
  const street = formatStreetLine(address).trim()
  if (street.length < 3) return null

  const parts = [street]
  const postalCode = address.postalCode?.trim()
  const city = address.city?.trim()
  const country = address.country?.trim()

  if (postalCode) parts.push(postalCode)
  if (city) parts.push(city)
  if (country) parts.push(country)

  return parts.join(', ')
}

export function hasPrefilledAddress(address: Pick<AddressInput, 'line1' | 'city' | 'postalCode'>): boolean {
  return address.line1.trim().length >= 3 && Boolean(address.city.trim() || address.postalCode.trim())
}

export async function resolvePrefilledAddress(address: PrefillAddress): Promise<ResolvedAddress | null> {
  const provider = getAddressAutocompleteProvider()
  if (!provider) return null

  const query = buildAddressGeocodeQuery(address)
  if (!query) return null

  const sessionToken = crypto.randomUUID()
  const suggestions = await provider.search(query, {
    country: address.country?.trim() || undefined,
    sessionToken,
  })
  if (!suggestions.length) return null

  const postalCode = address.postalCode?.trim()
  let best = suggestions[0]!
  if (postalCode) {
    const match = suggestions.find(
      (item) => item.label.includes(postalCode) || item.resolved?.postalCode === postalCode,
    )
    if (match) best = match
  }

  if (best.resolved) return best.resolved
  if (!provider.resolve) return null

  return provider.resolve(best.id, best.provider ?? 'google', sessionToken)
}
