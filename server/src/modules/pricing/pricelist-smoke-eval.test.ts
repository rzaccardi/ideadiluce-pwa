import { describe, expect, it } from 'vitest'
import { evaluatePricelistSmoke } from './pricelist-smoke-eval.js'

describe('evaluatePricelistSmoke', () => {
  it('è ok se rivenditori e installatori hanno prezzi diversi dal retail', () => {
    const verdict = evaluatePricelistSmoke([
      { key: 'retail', label: 'Retail', pricelistId: 10, cents: 19672 },
      { key: 'b2b', label: 'Rivenditori', pricelistId: 20, cents: 14000 },
      { key: 'professional', label: 'Installatori', pricelistId: 30, cents: 15500 },
    ])
    expect(verdict.ok).toBe(true)
    expect(verdict.distinctCents).toBe(3)
    expect(verdict.errors).toEqual([])
    expect(verdict.warnings).toEqual([])
  })

  it('fallisce se un listino configurato non restituisce prezzo', () => {
    const verdict = evaluatePricelistSmoke([
      { key: 'retail', label: 'Retail', pricelistId: 10, cents: 19672 },
      { key: 'b2b', label: 'Rivenditori', pricelistId: 20, cents: null },
      { key: 'professional', label: 'Installatori', pricelistId: 30, cents: 15500 },
    ])
    expect(verdict.ok).toBe(false)
    expect(verdict.errors).toContain('Nessun prezzo per Rivenditori (listino 20)')
  })

  it('avvisa se gli importi coincidono (listino applicato ma stesso netto)', () => {
    const verdict = evaluatePricelistSmoke([
      { key: 'retail', label: 'Retail', pricelistId: 10, cents: 10000 },
      { key: 'b2b', label: 'Rivenditori', pricelistId: 20, cents: 10000 },
      { key: 'professional', label: 'Installatori', pricelistId: 30, cents: 10000 },
    ])
    expect(verdict.ok).toBe(true)
    expect(verdict.distinctCents).toBe(1)
    expect(verdict.warnings[0]).toMatch(/Stesso importo/)
  })
})
