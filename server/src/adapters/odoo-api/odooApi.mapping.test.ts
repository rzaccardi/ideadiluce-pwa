import { describe, expect, it } from 'vitest'
import {
  buildOdooApiAddressWrite,
  buildOdooApiCustomerWrite,
  mapOdooApiCarrier,
  mapOdooApiPaymentMethod,
  netEurosFromCents,
  netEurosFromNetCents,
  odooApiAddressToProfile,
} from './odooApi.mapping.js'

describe('mapOdooApiCarrier', () => {
  it('normalizza dhl_express e internal pickup/free/flat', () => {
    expect(mapOdooApiCarrier({ carrierCode: 'dhl_express', serviceCode: 'express', label: 'DHL' })).toBe('dhl')
    expect(mapOdooApiCarrier({ carrierCode: 'internal', serviceCode: 'pickup_roma', label: 'Ritiro' })).toBe('pickup')
    expect(mapOdooApiCarrier({ carrierCode: 'internal', serviceCode: 'free', label: 'Gratis' })).toBe('free')
    expect(mapOdooApiCarrier({ carrierCode: 'internal', serviceCode: 'flat', label: 'Tariffa fissa' })).toBe('flat')
    expect(mapOdooApiCarrier({ carrierCode: 'fedex', serviceCode: 'ip', label: 'FedEx' })).toBe('fedex')
  })
})

describe('mapOdooApiPaymentMethod', () => {
  it('mappa paypal e bonifico, resto carta', () => {
    expect(mapOdooApiPaymentMethod('paypal')).toBe('paypal')
    expect(mapOdooApiPaymentMethod('bank_transfer')).toBe('bank_transfer')
    expect(mapOdooApiPaymentMethod('stripe')).toBe('card')
  })
})

describe('netEurosFromCents', () => {
  it('converte lordo IVA 22% in netto', () => {
    expect(netEurosFromCents(1220, 22)).toBe(10)
  })
})

describe('netEurosFromNetCents', () => {
  it('converte centesimi netti in euro', () => {
    expect(netEurosFromNetCents(1990)).toBe(19.9)
  })
})

describe('odoo address state_code', () => {
  it('scrive state_code dal campo provincia', () => {
    const write = buildOdooApiCustomerWrite({
      email: 'mario@example.com',
      firstName: 'Mario',
      lastName: 'Rossi',
      billingAddress: {
        firstName: 'Mario',
        lastName: 'Rossi',
        line1: 'Via Roma',
        streetNumber: '1',
        isSnc: false,
        city: 'Milano',
        postalCode: '20121',
        province: 'MI',
        country: 'IT',
      },
    })
    expect(write.state_code).toBe('MI')
    expect(
      buildOdooApiAddressWrite({
        firstName: 'Mario',
        lastName: 'Rossi',
        line1: 'Via Roma',
        streetNumber: '1',
        isSnc: false,
        city: 'Milano',
        postalCode: '20121',
        province: 'Milano',
        country: 'IT',
      }).state_code,
    ).toBe('MI')
  })

  it('legge state_code nel profilo PWA', () => {
    expect(
      odooApiAddressToProfile({
        id: 1,
        name: 'Mario Rossi',
        street: 'Via Roma 1',
        zip: '20121',
        city: 'Milano',
        state_code: 'MI',
        country_code: 'IT',
      }).province,
    ).toBe('MI')
  })
})
