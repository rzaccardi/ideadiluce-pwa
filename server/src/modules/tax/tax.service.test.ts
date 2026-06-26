import { describe, expect, it } from 'vitest'
import { Prisma, type TaxRule } from '@prisma/client'
import { buildTaxBreakdown, findMatchingTaxRule } from './tax.service.js'

const dec = (n: number) => new Prisma.Decimal(n)

/** Replica regole seed default (tax.service seedDefaultTaxRules). */
function seedLikeRules(): TaxRule[] {
  const base = {
    isProfessional: null,
    billingCountry: null,
    vatValid: null,
    disclaimerKey: null,
    odooFiscalPositionId: null,
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  return [
    {
      ...base,
      id: 'r1',
      priority: 100,
      customerSegment: 'BUSINESS',
      shippingCountry: 'EU_EXCL_IT',
      vatValid: true,
      taxRatePct: dec(0),
      taxLabel: 'Reverse charge',
    },
    {
      ...base,
      id: 'r2',
      priority: 85,
      customerSegment: 'BUSINESS',
      shippingCountry: 'IT',
      vatValid: true,
      taxRatePct: dec(22),
      taxLabel: 'IVA 22%',
    },
    {
      ...base,
      id: 'r3',
      priority: 80,
      customerSegment: 'RETAIL',
      shippingCountry: 'IT',
      taxRatePct: dec(22),
      taxLabel: 'IVA 22%',
    },
    {
      ...base,
      id: 'r4',
      priority: 75,
      customerSegment: 'BUSINESS',
      shippingCountry: 'IT',
      taxRatePct: dec(22),
      taxLabel: 'IVA 22%',
    },
    {
      ...base,
      id: 'r5',
      priority: 60,
      customerSegment: null,
      shippingCountry: 'EU',
      taxRatePct: dec(22),
      taxLabel: 'IVA 22%',
    },
    {
      ...base,
      id: 'r6',
      priority: 50,
      customerSegment: null,
      shippingCountry: 'EXTRA_EU',
      taxRatePct: dec(0),
      taxLabel: 'Esente IVA',
      disclaimerKey: 'extra_eu_duties',
    },
  ] as TaxRule[]
}

const NET = 10_000

describe('findMatchingTaxRule — matrice IVA core', () => {
  const rules = seedLikeRules()

  it('B2C Italia → 22%', () => {
    const rule = findMatchingTaxRule(rules, {
      netCents: NET,
      shippingCountry: 'IT',
      customerSegment: 'RETAIL',
    })
    expect(Number(rule?.taxRatePct)).toBe(22)
  })

  it('B2B Italia senza VAT valid → 22%', () => {
    const rule = findMatchingTaxRule(rules, {
      netCents: NET,
      shippingCountry: 'IT',
      customerSegment: 'BUSINESS',
      vatValid: false,
    })
    expect(Number(rule?.taxRatePct)).toBe(22)
  })

  it('B2B UE VAT valido + spedizione FR → 0% reverse charge', () => {
    const rule = findMatchingTaxRule(rules, {
      netCents: NET,
      shippingCountry: 'FR',
      customerSegment: 'BUSINESS',
      vatValid: true,
    })
    expect(Number(rule?.taxRatePct)).toBe(0)
    expect(rule?.taxLabel).toContain('Reverse')
  })

  it('B2B UE VAT valido + spedizione Italia → 22%', () => {
    const rule = findMatchingTaxRule(rules, {
      netCents: NET,
      shippingCountry: 'IT',
      customerSegment: 'BUSINESS',
      vatValid: true,
    })
    expect(Number(rule?.taxRatePct)).toBe(22)
  })

  it('B2B UE VAT non valido + spedizione FR → 22% (regola EU generica)', () => {
    const rule = findMatchingTaxRule(rules, {
      netCents: NET,
      shippingCountry: 'FR',
      customerSegment: 'BUSINESS',
      vatValid: false,
    })
    expect(Number(rule?.taxRatePct)).toBe(22)
  })

  it('Extra UE → 0% con disclaimer', () => {
    const rule = findMatchingTaxRule(rules, {
      netCents: NET,
      shippingCountry: 'US',
      customerSegment: 'RETAIL',
    })
    expect(Number(rule?.taxRatePct)).toBe(0)
    expect(rule?.disclaimerKey).toBe('extra_eu_duties')
  })

  it('usa shippingCountry come chiave (non billing)', () => {
    const rule = findMatchingTaxRule(rules, {
      netCents: NET,
      shippingCountry: 'FR',
      billingCountry: 'IT',
      customerSegment: 'BUSINESS',
      vatValid: true,
    })
    expect(Number(rule?.taxRatePct)).toBe(0)
  })
})

describe('buildTaxBreakdown — importi', () => {
  const rules = seedLikeRules()

  it('calcola tax e gross per B2C IT', () => {
    const rule = findMatchingTaxRule(rules, {
      netCents: NET,
      shippingCountry: 'IT',
      customerSegment: 'RETAIL',
    })
    const b = buildTaxBreakdown(
      { netCents: NET, shippingCountry: 'IT', customerSegment: 'RETAIL' },
      rule,
      false,
    )
    expect(b.taxCents).toBe(2200)
    expect(b.grossCents).toBe(12_200)
    expect(b.taxRatePct).toBe(22)
  })

  it('stima carrello e checkout usano stesso rate per stesso paese', () => {
    const input = { netCents: NET, shippingCountry: 'IT', customerSegment: 'RETAIL' as const }
    const rule = findMatchingTaxRule(rules, input)
    const estimate = buildTaxBreakdown(input, rule, true)
    const checkout = buildTaxBreakdown(input, rule, false)
    expect(estimate.taxRatePct).toBe(checkout.taxRatePct)
    expect(estimate.taxCents).toBe(checkout.taxCents)
  })
})

describe('vatForceAccepted — simulazione calculate', () => {
  const rules = seedLikeRules()

  it('con vatForceAccepted tratta vatValid come false (no reverse charge UE)', () => {
    const vatValid = false
    const rule = findMatchingTaxRule(rules, {
      netCents: NET,
      shippingCountry: 'DE',
      customerSegment: 'BUSINESS',
      vatValid,
    })
    expect(Number(rule?.taxRatePct)).toBe(22)
  })
})
