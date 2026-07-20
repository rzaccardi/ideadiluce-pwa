import { describe, expect, it } from 'vitest'
import { formatTechnicalProductRefLine } from './technical-product-ref'

describe('formatTechnicalProductRefLine', () => {
  it('formatta brand e codice', () => {
    expect(
      formatTechnicalProductRefLine({
        brand: { slug: 'tlb', name: 'TLB' },
        sku: '322805',
      }),
    ).toBe('TLB · COD 322805')
  })

  it('inferisce il brand dal titolo prodotto', () => {
    expect(
      formatTechnicalProductRefLine({
        name: 'Driver Elettronico AC 12V 35-105W TLB Dimmerabile',
        sku: '322805',
      }),
    ).toBe('TLB · COD 322805')
  })
})
