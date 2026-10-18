import { describe, expect, it } from 'vitest'
import { isPwaCheckoutQuotationRef } from './quotes.service.js'

describe('isPwaCheckoutQuotationRef', () => {
  it('riconosce bozze checkout PWA', () => {
    expect(isPwaCheckoutQuotationRef('PWA cmvcmdqt123')).toBe(true)
    expect(isPwaCheckoutQuotationRef('pwa-abc123-deadbeef01')).toBe(true)
    expect(isPwaCheckoutQuotationRef('PWA abc')).toBe(true)
  })

  it('non esclude le richieste preventivo', () => {
    expect(isPwaCheckoutQuotationRef('PWA-QUOTE-A1B2C3D4')).toBe(false)
  })

  it('lascia passare preventivi Odoo manuali', () => {
    expect(isPwaCheckoutQuotationRef(null)).toBe(false)
    expect(isPwaCheckoutQuotationRef('')).toBe(false)
    expect(isPwaCheckoutQuotationRef('SO596679')).toBe(false)
  })
})
