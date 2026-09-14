import { describe, expect, it } from 'vitest'
import { stripeCheckoutAddressDefaults, toStripeCheckoutContact } from './stripe-checkout-address'
import type { AddressInput } from '@/types/integrations'

const milano: AddressInput = {
  firstName: 'Mario',
  lastName: 'Rossi',
  line1: 'Via Roma',
  streetNumber: '12',
  isSnc: false,
  city: 'Milano',
  postalCode: '20121',
  province: 'MI',
  country: 'IT',
  phone: '+393331234567',
}

describe('toStripeCheckoutContact', () => {
  it('invia la provincia come address.state', () => {
    expect(toStripeCheckoutContact('Mario Rossi', milano).address).toMatchObject({
      line1: 'Via Roma 12',
      city: 'Milano',
      postal_code: '20121',
      state: 'MI',
      country: 'IT',
    })
  })
})

describe('stripeCheckoutAddressDefaults', () => {
  it('riempie billing e shipping per Checkout Elements', () => {
    const defaults = stripeCheckoutAddressDefaults(milano, milano)
    expect(defaults?.billingAddress.address?.state).toBe('MI')
    expect(defaults?.shippingAddress.address?.state).toBe('MI')
  })
})
