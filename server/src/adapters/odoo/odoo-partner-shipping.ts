import {
  formatStreetLine,
  splitLine1AndStreetNumber,
} from '../../modules/checkout/checkout-address.validators.js'
import type { OdooCustomerProfile } from './odooCustomerAdapter.js'

export type OdooPartnerType = 'contact' | 'invoice' | 'delivery' | 'other' | 'private'

export type OdooPartnerAddressRow = {
  id: number
  name?: string | false
  type?: string | false
  street?: string | false
  street2?: string | false
  city?: string | false
  zip?: string | false
  phone?: string | false
}

export type OdooShippingDestinationKind = 'parent' | 'delivery' | 'contact'

function asTrimmed(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function odooPartnerStreet(row: Pick<OdooPartnerAddressRow, 'street'>): string {
  return asTrimmed(row.street)
}

export function normalizeOdooPartnerType(type: unknown): OdooPartnerType {
  if (type === 'invoice' || type === 'delivery' || type === 'other' || type === 'private') {
    return type
  }
  return 'contact'
}

/** Child usati come destinazione: type delivery, o altri child con via. Esclude contact senza street e invoice. */
export function isOdooChildShippingDestination(row: OdooPartnerAddressRow): boolean {
  const type = normalizeOdooPartnerType(row.type)
  const street = odooPartnerStreet(row)
  if (type === 'invoice' || type === 'private') return false
  if (type === 'delivery') return true
  return street.length > 0
}

export function odooShippingDestinationKind(row: OdooPartnerAddressRow): OdooShippingDestinationKind {
  const type = normalizeOdooPartnerType(row.type)
  if (type === 'delivery') return 'delivery'
  if (type === 'contact' || type === 'other') return streetKind(row)
  return 'contact'
}

function streetKind(row: OdooPartnerAddressRow): OdooShippingDestinationKind {
  return normalizeOdooPartnerType(row.type) === 'delivery' ? 'delivery' : 'contact'
}

export function odooShippingAddressId(partnerId: number): string {
  return `odoo:${partnerId}`
}

export function parseOdooShippingAddressId(id: string | null | undefined): number | null {
  if (!id) return null
  const match = /^odoo:(\d+)$/.exec(id.trim())
  if (!match) return null
  const parsed = Number(match[1])
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

export function splitPartnerDisplayName(name: string): Pick<OdooCustomerProfile, 'firstName' | 'lastName'> {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { firstName: 'Destinatario', lastName: 'Spedizione' }
  if (parts.length === 1) return { firstName: parts[0]!, lastName: parts[0]! }
  return {
    firstName: parts.slice(0, -1).join(' '),
    lastName: parts.at(-1) ?? parts[0]!,
  }
}

export function odooPartnerToShippingProfile(
  row: OdooPartnerAddressRow,
  country: string,
): OdooCustomerProfile {
  const name = asTrimmed(row.name)
  const split = splitLine1AndStreetNumber(odooPartnerStreet(row))
  return {
    ...splitPartnerDisplayName(name || 'Destinatario'),
    line1: split.line1,
    streetNumber: split.streetNumber,
    isSnc: split.isSnc,
    line2: asTrimmed(row.street2) || undefined,
    city: asTrimmed(row.city),
    postalCode: asTrimmed(row.zip),
    country: country.toUpperCase() || 'IT',
    phone: asTrimmed(row.phone) || undefined,
  }
}

export function shippingAddressFingerprint(address: {
  line1?: string | null
  streetNumber?: string | null
  isSnc?: boolean | null
  city?: string | null
  postalCode?: string | null
  country?: string | null
}): string {
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

export function shippingAddressesMatch(
  a: Parameters<typeof shippingAddressFingerprint>[0],
  b: Parameters<typeof shippingAddressFingerprint>[0],
): boolean {
  const left = shippingAddressFingerprint(a)
  const right = shippingAddressFingerprint(b)
  if (left !== right) return false
  return Boolean(a.line1?.trim() || a.city?.trim())
}
