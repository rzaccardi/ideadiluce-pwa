import type { UserAddressDTO, UserDTO } from '@/types/dto'
import type { AddressInput } from '@/types/integrations'
import {
  formatStreetLine,
  isCheckoutAddressValid,
  splitLine1AndStreetNumber,
} from '@/lib/checkout-address.validators'
import { normalizeAddressProvince } from '@/lib/italian-provinces'

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
    province: '',
    country: 'IT',
    phone: '',
    courierNotes: '',
  }
}

export function shippingAddressFromUser(user: UserDTO): AddressInput {
  const saved = user.shippingAddress
  const split = splitLine1AndStreetNumber(
    saved?.line1 ?? '',
    saved?.streetNumber ?? '',
    saved?.isSnc === true,
  )
  return {
    ...emptyAddress(),
    ...(saved ?? {}),
    firstName: saved?.firstName || user.firstName || '',
    lastName: saved?.lastName || user.lastName || '',
    line1: split.line1,
    streetNumber: split.streetNumber,
    isSnc: split.isSnc,
    province: normalizeAddressProvince(saved?.country ?? 'IT', saved?.province),
    phone: saved?.phone || user.phone || '',
    id: saved?.id,
    label: saved?.label,
  }
}

export function formatAddressLocality(
  address: { postalCode?: string; city?: string; province?: string } | null | undefined,
): string {
  if (!address) return ''
  const province = address.province?.trim()
  const city = address.city?.trim() ?? ''
  const cityPart = province ? (city ? `${city} (${province})` : province) : city
  return [address.postalCode?.trim(), cityPart].filter(Boolean).join(' ')
}

export function formatAddressSummary(address: UserAddressDTO | AddressInput | null | undefined): string {
  if (!address?.line1?.trim()) return '—'
  return [formatStreetLine(address), formatAddressLocality(address)].filter(Boolean).join(', ')
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
    province: address.province.trim() || undefined,
    country: address.country.trim().toUpperCase().slice(0, 2),
    phone: address.phone?.trim() || undefined,
    courierNotes: address.courierNotes?.trim() || undefined,
    id: address.id?.trim() || undefined,
    label: address.label?.trim() || undefined,
  }
}

export function isAddressComplete(address: AddressInput): boolean {
  return isCheckoutAddressValid(address)
}
