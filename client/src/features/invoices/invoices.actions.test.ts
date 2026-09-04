import { describe, expect, it } from 'vitest'
import { invoicePdfFilename } from './invoices.actions'

describe('invoicePdfFilename', () => {
  it('sanitizza slash e spazi', () => {
    expect(invoicePdfFilename('FT/2024 001')).toBe('FT_2024_001.pdf')
  })

  it('non duplica l’estensione', () => {
    expect(invoicePdfFilename('fattura.pdf')).toBe('fattura.pdf')
  })
})
