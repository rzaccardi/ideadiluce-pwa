import type { AddressInput } from '@/types/integrations'
import { formatAddressLocality } from '@/lib/address'
import { checkoutCountryLabel } from './constants'

export function formatCheckoutStreetLine(address: AddressInput): string {
  const line = address.line1.trim()
  if (!line) return ''
  if (address.isSnc) return `${line} (SNC)`
  const num = address.streetNumber?.trim()
  return num ? `${line}, ${num}` : line
}

export function formatCheckoutLocalityLine(address: AddressInput): string {
  const parts = [formatAddressLocality(address), checkoutCountryLabel(address.country)].filter(Boolean)
  return parts.join(' · ')
}

export function formatCheckoutAddressSummary(address: AddressInput): {
  street: string
  locality: string
} {
  return {
    street: formatCheckoutStreetLine(address),
    locality: formatCheckoutLocalityLine(address),
  }
}
