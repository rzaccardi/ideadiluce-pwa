import { describe, expect, it } from 'vitest'
import {
  filterSellableCarrierQuotes,
  isSellableDhlService,
  isSellableFedexService,
} from './sellable-carrier-services.js'
import type { ShippingQuoteLine } from './types.js'

function line(
  partial: Pick<ShippingQuoteLine, 'carrierCode' | 'serviceCode' | 'label'> &
    Partial<ShippingQuoteLine>,
): ShippingQuoteLine {
  return {
    methodRef: `live_${partial.carrierCode}:${partial.serviceCode}`,
    amountCents: 1000,
    currencyCode: 'EUR',
    etaDays: 2,
    source: partial.carrierCode === 'dhl' ? 'dhl' : 'fedex',
    ...partial,
  }
}

describe('isSellableDhlService', () => {
  it('Italia solo Express Domestic N', () => {
    expect(isSellableDhlService('IT', 'N')).toBe(true)
    expect(isSellableDhlService('IT', 'P')).toBe(false)
    expect(isSellableDhlService('IT', 'Q')).toBe(false)
  })

  it('estero solo Express Worldwide P', () => {
    expect(isSellableDhlService('DE', 'P')).toBe(true)
    expect(isSellableDhlService('US', 'P')).toBe(true)
    expect(isSellableDhlService('DE', 'N')).toBe(false)
  })
})

describe('isSellableFedexService', () => {
  it('Italia Priority', () => {
    expect(isSellableFedexService('IT', 'FEDEX_PRIORITY')).toBe(true)
    expect(isSellableFedexService('IT', 'FEDEX_REGIONAL_ECONOMY')).toBe(false)
  })

  it('UE Regional Economy', () => {
    expect(isSellableFedexService('DE', 'FEDEX_REGIONAL_ECONOMY')).toBe(true)
    expect(isSellableFedexService('FR', 'INTERNATIONAL_ECONOMY')).toBe(false)
  })

  it('extra-UE International Economy', () => {
    expect(isSellableFedexService('US', 'INTERNATIONAL_ECONOMY')).toBe(true)
    expect(isSellableFedexService('US', 'FEDEX_INTERNATIONAL_ECONOMY')).toBe(true)
    expect(isSellableFedexService('US', 'FEDEX_PRIORITY')).toBe(false)
  })
})

describe('filterSellableCarrierQuotes', () => {
  it('filtra Medical Express e lascia solo N per Roma', () => {
    const quotes = [
      line({ carrierCode: 'dhl', serviceCode: 'N', label: 'Express Domestic' }),
      line({ carrierCode: 'dhl', serviceCode: 'Q', label: 'Medical Express' }),
      line({ carrierCode: 'dhl', serviceCode: 'P', label: 'Express Worldwide' }),
    ]
    expect(filterSellableCarrierQuotes('IT', quotes).map((q) => q.serviceCode)).toEqual(['N'])
  })
})
