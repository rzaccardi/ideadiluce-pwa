import { describe, expect, it } from 'vitest'
import {
  parseStripePwaAddress,
  toStripeAddressFields,
  toStripeShippingFields,
} from './stripe-address.js'

const milano = {
  firstName: 'Mario',
  lastName: 'Rossi',
  line1: 'Via Roma',
  streetNumber: '12',
  isSnc: false,
  city: 'Milano',
  postalCode: '20121',
  province: 'MI',
  country: 'IT',
  phone: '3331234567',
}

describe('toStripeAddressFields', () => {
  it('mappa la provincia PWA su address.state e include il civico', () => {
    expect(toStripeAddressFields(milano)).toEqual({
      line1: 'Via Roma 12',
      city: 'Milano',
      state: 'MI',
      postal_code: '20121',
      country: 'IT',
    })
  })

  it('omette state se la provincia è vuota', () => {
    const mapped = toStripeAddressFields({ ...milano, country: 'FR', province: '' })
    expect(mapped.state).toBeUndefined()
    expect(mapped.country).toBe('FR')
  })
})

describe('toStripeShippingFields', () => {
  it('normalizza il telefono in E.164 e tiene state', () => {
    expect(toStripeShippingFields(milano)).toMatchObject({
      name: 'Mario Rossi',
      phone: '+393331234567',
      address: { state: 'MI', country: 'IT' },
    })
  })
})

describe('parseStripePwaAddress', () => {
  it('legge province dal JSON ordine', () => {
    const parsed = parseStripePwaAddress({ ...milano, extra: true })
    expect(parsed?.province).toBe('MI')
    expect(parsed?.postalCode).toBe('20121')
  })

  it('rifiuta JSON senza via', () => {
    expect(parseStripePwaAddress({ city: 'Milano', postalCode: '20121', country: 'IT' })).toBeNull()
  })
})
