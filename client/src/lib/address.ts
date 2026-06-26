import type { UserAddressDTO, UserDTO } from '@/types/dto'
import type { AddressInput } from '@/types/integrations'
import { formatStreetLine, isCheckoutAddressValid } from '@/lib/checkout-address.validators'

export function emptyAddress(): AddressInput {
  return {
    firstName: '',
    lastName: '',
    line1: '',
    streetNumber: '',
    isSnc: false,
    line2: '',
    city: '',
    postalCode: '',
    country: 'IT',
    phone: '',
    courierNotes: '',
  }
}

export function shippingAddressFromUser(user: UserDTO): AddressInput {
  const saved = user.shippingAddress
  return {
    ...emptyAddress(),
    ...(saved ?? {}),
    firstName: saved?.firstName || user.firstName || '',
    lastName: saved?.lastName || user.lastName || '',
    phone: saved?.phone || user.phone || '',
  }
}

export function formatAddressSummary(address: UserAddressDTO | AddressInput | null | undefined): string {
  if (!address?.line1?.trim()) return '—'
  const locality = [address.postalCode, address.city].filter(Boolean).join(' ')
  return [formatStreetLine(address), locality].filter(Boolean).join(', ')
}

export function addressInputToDto(address: AddressInput): UserAddressDTO | null {
  if (!address.line1.trim()) return null

  return {
    firstName: address.firstName.trim(),
    lastName: address.lastName.trim(),
    line1: address.line1.trim(),
    streetNumber: address.streetNumber.trim() || undefined,
    isSnc: address.isSnc || undefined,
    line2: address.line2?.trim() || undefined,
    city: address.city.trim(),
    postalCode: address.postalCode.trim(),
    country: address.country.trim().toUpperCase().slice(0, 2),
    phone: address.phone?.trim() || undefined,
    courierNotes: address.courierNotes?.trim() || undefined,
  }
}

export function isAddressComplete(address: AddressInput): boolean {
  return isCheckoutAddressValid(address)
}
