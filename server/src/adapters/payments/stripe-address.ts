import { formatStreetLine, toE164Phone } from '../../modules/checkout/checkout-address.validators.js'

/** Indirizzo PWA da copiare su Customer / PaymentIntent / Checkout Session Stripe. */
export type StripePwaAddress = {
  firstName?: string | null
  lastName?: string | null
  line1: string
  streetNumber?: string | null
  isSnc?: boolean | null
  line2?: string | null
  city: string
  postalCode: string
  province?: string | null
  country: string
  phone?: string | null
}

export type StripeAddressFields = {
  line1: string
  line2?: string
  city: string
  state?: string
  postal_code: string
  country: string
}

export type StripeShippingFields = {
  name: string
  address: StripeAddressFields
  phone?: string
}

export function parseStripePwaAddress(value: unknown): StripePwaAddress | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const address = value as Record<string, unknown>
  if (typeof address.line1 !== 'string' || !address.line1.trim()) return null
  if (typeof address.city !== 'string' || !address.city.trim()) return null
  if (typeof address.postalCode !== 'string' || !address.postalCode.trim()) return null
  if (typeof address.country !== 'string' || address.country.trim().length !== 2) return null
  return {
    firstName: typeof address.firstName === 'string' ? address.firstName : '',
    lastName: typeof address.lastName === 'string' ? address.lastName : '',
    line1: address.line1,
    streetNumber: typeof address.streetNumber === 'string' ? address.streetNumber : '',
    isSnc: address.isSnc === true,
    line2: typeof address.line2 === 'string' ? address.line2 : '',
    city: address.city,
    postalCode: address.postalCode,
    province: typeof address.province === 'string' ? address.province : '',
    country: address.country,
    phone: typeof address.phone === 'string' ? address.phone : '',
  }
}

export function stripeCustomerName(address: StripePwaAddress, fallback = 'Cliente'): string {
  return [address.firstName?.trim(), address.lastName?.trim()].filter(Boolean).join(' ') || fallback
}

export function toStripeAddressFields(address: StripePwaAddress): StripeAddressFields {
  const state = address.province?.trim()
  const line2 = address.line2?.trim()
  return {
    line1: formatStreetLine({
      line1: address.line1,
      streetNumber: address.streetNumber ?? '',
      isSnc: address.isSnc ?? false,
    }),
    ...(line2 ? { line2 } : {}),
    city: address.city.trim(),
    ...(state ? { state } : {}),
    postal_code: address.postalCode.trim(),
    country: address.country.trim().toUpperCase(),
  }
}

export function toStripeShippingFields(address: StripePwaAddress): StripeShippingFields {
  const phone = toE164Phone(address.phone ?? '')
  return {
    name: stripeCustomerName(address),
    address: toStripeAddressFields(address),
    ...(phone ? { phone } : {}),
  }
}
