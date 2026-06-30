import { describe, expect, it } from 'vitest'
import { resolveCartEstimateTotals, usePersistedCartTotals } from './cartTotals.js'

describe('usePersistedCartTotals', () => {
  const pricedCart = {
    estimatedSubtotal: 123_279,
    lastPricedAt: new Date('2026-06-01'),
  }

  it('usa i totali persistiti quando il subtotale dalle righe non è disponibile', () => {
    expect(usePersistedCartTotals(pricedCart, null)).toBe(true)
  })

  it('ignora i totali persistiti quando il subtotale dalle righe non combacia', () => {
    expect(usePersistedCartTotals(pricedCart, 164)).toBe(false)
  })

  it('usa i totali persistiti quando il subtotale dalle righe combacia', () => {
    expect(usePersistedCartTotals(pricedCart, 123_279)).toBe(true)
  })
})

describe('resolveCartEstimateTotals', () => {
  it('ricalcola dal subtotale righe se i totali persistiti sono obsoleti', () => {
    const result = resolveCartEstimateTotals(
      {
        estimatedSubtotal: 123_279,
        estimatedTax: 271_211,
        estimatedShipping: 0,
        estimatedTotal: 150_400,
        lastPricedAt: new Date('2026-06-01'),
      },
      164,
      36,
    )

    expect(result.estimatedSubtotal).toBe(164)
    expect(result.estimatedTax).toBe(36)
    expect(result.estimatedTotal).toBe(200)
  })
})
