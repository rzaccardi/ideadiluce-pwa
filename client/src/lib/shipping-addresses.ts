import type { UserAddressDTO, UserShippingAddressDTO } from '@/types/dto'
import type { AddressInput } from '@/types/integrations'
import { emptyAddress, formatAddressSummary } from '@/lib/address'
import { formatStreetLine, splitLine1AndStreetNumber } from '@/lib/checkout-address.validators'

export const BILLING_SHIPPING_SELECTION = 'billing'
export const OTHER_SHIPPING_SELECTION = 'other'

export function shippingAddressFingerprint(address: UserAddressDTO | AddressInput): string {
  const street = formatStreetLine({
    line1: address.line1 ?? '',
    streetNumber: address.streetNumber ?? '',
    isSnc: address.isSnc === true,
  })
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
  return [
    street,
    (address.city ?? '').trim().toLowerCase(),
    (address.postalCode ?? '').trim().toLowerCase(),
    (address.country ?? '').trim().toUpperCase(),
  ].join('|')
}

export function savedAddressToInput(address: UserAddressDTO): AddressInput {
  const split = splitLine1AndStreetNumber(
    address.line1,
    address.streetNumber ?? '',
    address.isSnc === true,
  )
  return {
    ...emptyAddress(),
    ...address,
    line1: split.line1,
    streetNumber: split.streetNumber,
    isSnc: split.isSnc,
    phone: address.phone ?? '',
    courierNotes: address.courierNotes ?? '',
    id: address.id,
    label: address.label,
  }
}

export function matchSavedShippingAddress(
  addresses: UserShippingAddressDTO[],
  current: UserAddressDTO | AddressInput | null | undefined,
): UserShippingAddressDTO | undefined {
  if (!current) return addresses.find((address) => address.isDefault)
  if (current.id) {
    const byId = addresses.find((address) => address.id === current.id)
    if (byId) return byId
  }
  const fingerprint = shippingAddressFingerprint(current)
  return addresses.find((address) => shippingAddressFingerprint(address) === fingerprint)
}

export function formatShippingAddressCard(address: UserShippingAddressDTO | AddressInput): {
  title: string
  lines: string
} {
  const title =
    ('label' in address && address.label?.trim()) ||
    [address.firstName, address.lastName].filter(Boolean).join(' ').trim() ||
    address.city
  return {
    title,
    lines: formatAddressSummary(address),
  }
}
