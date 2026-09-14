import { describe, expect, it } from 'vitest'
import {
  mapOdooApiCarrier,
  mapOdooApiPaymentMethod,
  netEurosFromCents,
  netEurosFromNetCents,
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
