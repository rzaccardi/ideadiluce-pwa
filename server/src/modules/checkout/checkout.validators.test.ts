import { describe, expect, it } from 'vitest'
import { checkoutStartSchema } from './checkout.validators.js'

const billingAddress = {
  firstName: 'Mario',
  lastName: 'Rossi',
  line1: 'Via Roma',
  streetNumber: '1',
  city: 'Milano',
  postalCode: '20121',
  country: 'IT',
  phone: '+393331234567',
}

const baseCheckout = {
  email: 'mario@example.com',
  customerSegment: 'retail' as const,
  billingAddress,
  shippingAddress: billingAddress,
}

describe('checkoutStartSchema retail fiscal code', () => {
  it('allows B2C checkout in Italy without fiscal code', () => {
    const result = checkoutStartSchema.safeParse({
      ...baseCheckout,
      business: {},
    })

    expect(result.success).toBe(true)
  })

  it('rejects invalid fiscal code when provided', () => {
    const result = checkoutStartSchema.safeParse({
      ...baseCheckout,
      business: { fiscalCode: 'INVALID' },
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.join('.') === 'business.fiscalCode')).toBe(
        true,
      )
    }
  })

  it('accepts valid fiscal code when provided', () => {
    const result = checkoutStartSchema.safeParse({
      ...baseCheckout,
      business: { fiscalCode: 'RSSMRA85M01H501Q' },
    })

    expect(result.success).toBe(true)
  })
})
