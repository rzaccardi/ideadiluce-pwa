import { describe, expect, it } from 'vitest'
import {
  resolveCheckoutBillingAddress,
  splitLine1AndStreetNumber,
} from './checkout-address.validators.js'

const shipping = {
  firstName: 'Mario',
  lastName: 'Rossi',
  line1: 'Via Roma',
  streetNumber: '1',
  isSnc: false,
  city: 'Roma',
  postalCode: '00100',
  province: 'RM',
  country: 'IT',
  phone: '+393331234567',
}

const staleBilling = {
  ...shipping,
  line1: 'Vecchia Via',
  streetNumber: '99',
  city: 'Milano',
  postalCode: '20100',
  province: 'MI',
}

describe('splitLine1AndStreetNumber', () => {
  it('estrae il civico da street Odoo combinata', () => {
    expect(splitLine1AndStreetNumber('Via Roma 69')).toEqual({
      line1: 'Via Roma',
      streetNumber: '69',
      isSnc: false,
    })
  })

  it('accetta civici tipo 12/A', () => {
    expect(splitLine1AndStreetNumber('Corso Italia, 12/A')).toEqual({
      line1: 'Corso Italia',
      streetNumber: '12/A',
      isSnc: false,
    })
  })
})

describe('resolveCheckoutBillingAddress', () => {
  it('per autenticato senza dropship forza billing = shipping', () => {
    const billing = resolveCheckoutBillingAddress({
      billingAddress: staleBilling,
      shippingAddress: shipping,
      authenticated: true,
      hasDropship: false,
    })
    expect(billing.line1).toBe('Via Roma')
    expect(billing.city).toBe('Roma')
    expect(billing.postalCode).toBe('00100')
  })

  it('con dropship conserva billing distinto', () => {
    const billing = resolveCheckoutBillingAddress({
      billingAddress: staleBilling,
      shippingAddress: shipping,
      authenticated: true,
      hasDropship: true,
    })
    expect(billing.line1).toBe('Vecchia Via')
    expect(billing.city).toBe('Milano')
  })

  it('se billing incompleto usa shipping anche da guest', () => {
    const billing = resolveCheckoutBillingAddress({
      billingAddress: { ...staleBilling, line1: '', city: '', postalCode: '' },
      shippingAddress: shipping,
      authenticated: false,
      hasDropship: false,
    })
    expect(billing.line1).toBe('Via Roma')
    expect(billing.city).toBe('Roma')
  })
})
