import { describe, expect, it } from 'vitest'
import { applyPricelistItemToListPriceEuros, eurosToCents } from './pricelist-item-price.js'

describe('applyPricelistItemToListPriceEuros', () => {
  it('usa il prezzo fisso del listino rivenditori/installatori', () => {
    expect(applyPricelistItemToListPriceEuros(5.41, { compute_price: 'fixed', fixed_price: 3.18 })).toBe(3.18)
    expect(applyPricelistItemToListPriceEuros(5.41, { compute_price: 'fixed', fixed_price: 3.92 })).toBe(3.92)
    expect(eurosToCents(3.18)).toBe(318)
    expect(eurosToCents(3.92)).toBe(392)
  })

  it('applica percentuale e formula sul listino base', () => {
    expect(applyPricelistItemToListPriceEuros(100, { compute_price: 'percentage', percent_price: 33 })).toBeCloseTo(67)
    expect(
      applyPricelistItemToListPriceEuros(100, {
        compute_price: 'formula',
        price_discount: 10,
        price_surcharge: -1,
      }),
    ).toBeCloseTo(89)
  })

  it('ignora regole con min_quantity > 1', () => {
    expect(
      applyPricelistItemToListPriceEuros(5.41, { compute_price: 'fixed', fixed_price: 1, min_quantity: 10 }),
    ).toBeNull()
  })
})
