import type { StripeCheckoutContact } from '@stripe/stripe-js'
import type { AddressInput } from '@/types/integrations'
import { formatStreetLine } from '@/lib/checkout-address.validators'

function personName(address: AddressInput, fallback = 'Cliente'): string {
  return [address.firstName.trim(), address.lastName.trim()].filter(Boolean).join(' ') || fallback
}

export function toStripeCheckoutContact(name: string, address: AddressInput): StripeCheckoutContact {
  const province = address.province.trim()
  return {
    name: name.trim() || personName(address),
    address: {
      country: address.country,
      line1: formatStreetLine(address),
      line2: address.line2?.trim() || null,
      city: address.city,
      postal_code: address.postalCode,
      state: province || null,
    },
  }
}

export function stripeCheckoutAddressDefaults(
  billing: AddressInput,
  shipping: AddressInput,
  cardholderName?: string,
): { billingAddress: StripeCheckoutContact; shippingAddress: StripeCheckoutContact } | undefined {
  if (!billing.country.trim() || !billing.city.trim() || !billing.postalCode.trim()) return undefined
  const billingName = cardholderName?.trim() || personName(billing)
  return {
    billingAddress: toStripeCheckoutContact(billingName, billing),
    shippingAddress: toStripeCheckoutContact(personName(shipping, billingName), shipping),
  }
}
