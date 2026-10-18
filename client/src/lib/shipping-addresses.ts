import type { UserAddressDTO, UserShippingAddressDTO } from '@/types/dto'
import type { AddressInput } from '@/types/integrations'
import { emptyAddress, formatAddressSummary } from '@/lib/address'
import { formatStreetLine, splitLine1AndStreetNumber } from '@/lib/checkout-address.validators'
import { normalizeAddressProvince } from '@/lib/italian-provinces'

export const BILLING_SHIPPING_SELECTION = 'billing'
export const OTHER_SHIPPING_SELECTION = 'other'

/** Solo punteggiatura, trattini o slash: in spesso sostituiscono una via assente. */
const PLACEHOLDER_STREET =
  /^(?:[-–—−‐‑_/\\|.,·•]+|n\/?a|n\.?d\.?|s\.?n\.?c\.?|null|false|undefined|none|vuoto|test|xxx+)$/i

/** Via fisica utilizzabile: esclude vuoto e placeholder (\"-\", \"/\") da sync incompleto. */
export function isUsableShippingStreet(line1: string | null | undefined): boolean {
  const value = (line1 ?? '')
    .normalize('NFKC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim()
  if (!value) return false
  if (PLACEHOLDER_STREET.test(value)) return false
  if (!/\p{L}/u.test(value)) return false
  return true
}

export function isUsableShippingAddress(
  address: Pick<UserAddressDTO, 'line1' | 'city' | 'postalCode'> | null | undefined,
): boolean {
  if (!isUsableShippingStreet(address?.line1)) return false
  return Boolean(address?.city?.trim() || address?.postalCode?.trim())
}

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
    province: normalizeAddressProvince(address.country, address.province),
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

/** Etichetta compatta per la select checkout (nome: via, CAP città). */
export function formatShippingAddressSelectOption(address: UserShippingAddressDTO | AddressInput): string {
  const card = formatShippingAddressCard(address)
  if (!card.lines || card.lines === '-') return card.title
  return `${card.title} - ${card.lines}`
}
