import type { UserAddressDTO } from '@/types/dto'
import { formatStreetLine } from '@/lib/checkout-address.validators'

/** Righe indirizzo per conferma ordine (include civico / SNC). */
export function formatThankYouAddressBlock(address: UserAddressDTO | null | undefined): string[] {
  if (!address) return []
  const name = [address.firstName, address.lastName].filter(Boolean).join(' ')
  const street = formatStreetLine({
    line1: address.line1,
    streetNumber: address.streetNumber,
    isSnc: address.isSnc,
  })
  const snc = address.isSnc ? ' (SNC)' : ''
  const locality = [address.postalCode, address.city, address.province ? `(${address.province})` : '']
    .filter(Boolean)
    .join(' ')
  const lines = [
    name,
    street ? `${street}${snc}` : '',
    address.line2?.trim() || '',
    locality,
    address.country?.trim().toUpperCase() || '',
  ].filter(Boolean)
  if (address.phone?.trim()) lines.push(address.phone.trim())
  return lines
}

export function thankYouAddressesEqual(
  a: UserAddressDTO | null | undefined,
  b: UserAddressDTO | null | undefined,
): boolean {
  if (!a || !b) return false
  return (
    formatThankYouAddressBlock(a).join('|').toLowerCase() ===
    formatThankYouAddressBlock(b).join('|').toLowerCase()
  )
}
