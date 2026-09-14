import { describe, expect, it } from 'vitest'
import { normalizeItalianProvince, provinceFromAddressParts } from './italian-provinces.js'

describe('normalizeItalianProvince', () => {
  it('accetta sigla, nome e alias', () => {
    expect(normalizeItalianProvince('mi')).toBe('MI')
    expect(normalizeItalianProvince('Milano')).toBe('MI')
    expect(normalizeItalianProvince('Provincia di Lucca')).toBe('LU')
    expect(normalizeItalianProvince('Roma (RM)')).toBe('RM')
    expect(normalizeItalianProvince('CI')).toBe('SU')
  })

  it('rifiuta valori sconosciuti', () => {
    expect(normalizeItalianProvince('')).toBe('')
    expect(normalizeItalianProvince('XX')).toBe('')
  })
})

describe('provinceFromAddressParts', () => {
  it('prende il primo candidato riconoscibile', () => {
    expect(provinceFromAddressParts('IT', 'Toscana', 'Lucca')).toBe('LU')
  })
})
