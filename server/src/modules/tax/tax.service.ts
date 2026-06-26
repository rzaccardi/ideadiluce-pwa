import type { CustomerSegment, TaxRule } from '@prisma/client'
import type { TaxBreakdownDTO } from '../../types/dto.js'
import {
  DEFAULT_TAX_LABEL,
  DEFAULT_TAX_RATE_PCT,
  isEuCountry,
  matchesTaxCountry,
  normalizeCountryCode,
} from './tax.constants.js'
import { taxRepository } from './tax.repository.js'

export type TaxCalculationInput = {
  netCents: number
  shippingCountry: string
  billingCountry?: string | null
  customerSegment?: CustomerSegment | null
  isProfessional?: boolean | null
  vatValid?: boolean | null
  vatForceAccepted?: boolean
}

function rateFromRule(rule: TaxRule | null): number {
  if (!rule) return DEFAULT_TAX_RATE_PCT
  return Number(rule.taxRatePct)
}

function segmentMatches(rule: TaxRule, segment: CustomerSegment | null | undefined): boolean {
  if (!rule.customerSegment) return true
  if (!segment) return false
  return rule.customerSegment === segment
}

function professionalMatches(rule: TaxRule, isProfessional: boolean | null | undefined): boolean {
  if (rule.isProfessional == null) return true
  if (isProfessional == null) return false
  return rule.isProfessional === isProfessional
}

function vatMatches(rule: TaxRule, vatValid: boolean | null | undefined): boolean {
  if (rule.vatValid == null) return true
  if (vatValid == null) return false
  return rule.vatValid === vatValid
}

function billingMatches(rule: TaxRule, billingCountry: string | null | undefined): boolean {
  if (!rule.billingCountry) return true
  if (!billingCountry) return false
  return matchesTaxCountry(rule.billingCountry, billingCountry)
}

export function findMatchingTaxRule(
  rules: TaxRule[],
  input: TaxCalculationInput,
): TaxRule | null {
  const shipping = normalizeCountryCode(input.shippingCountry)
  for (const rule of rules) {
    if (!segmentMatches(rule, input.customerSegment)) continue
    if (!professionalMatches(rule, input.isProfessional)) continue
    if (!billingMatches(rule, input.billingCountry)) continue
    if (!matchesTaxCountry(rule.shippingCountry, shipping)) continue
    if (!vatMatches(rule, input.vatValid)) continue
    return rule
  }
  return null
}

function fallbackRule(input: TaxCalculationInput): {
  taxRatePct: number
  taxLabel: string
  disclaimerKey?: string
} {
  const shipping = normalizeCountryCode(input.shippingCountry)
  if (isEuCountry(shipping)) {
    return { taxRatePct: DEFAULT_TAX_RATE_PCT, taxLabel: DEFAULT_TAX_LABEL }
  }
  return {
    taxRatePct: 0,
    taxLabel: 'Esente IVA',
    disclaimerKey: 'extra_eu_duties',
  }
}

export function buildTaxBreakdown(
  input: TaxCalculationInput,
  rule: TaxRule | null,
  isEstimate: boolean,
): TaxBreakdownDTO {
  const fallback = rule
    ? {
        taxRatePct: rateFromRule(rule),
        taxLabel: rule.taxLabel,
        disclaimerKey: rule.disclaimerKey ?? undefined,
        ruleId: rule.id,
        odooFiscalPositionId: rule.odooFiscalPositionId,
      }
    : (() => {
        const fb = fallbackRule(input)
        return {
          taxRatePct: fb.taxRatePct,
          taxLabel: fb.taxLabel,
          disclaimerKey: fb.disclaimerKey,
          ruleId: undefined,
          odooFiscalPositionId: null as number | null,
        }
      })()

  const taxCents = Math.round((input.netCents * fallback.taxRatePct) / 100)
  const breakdown: TaxBreakdownDTO = {
    netCents: input.netCents,
    taxCents,
    taxRatePct: fallback.taxRatePct,
    taxLabel: fallback.taxLabel,
    grossCents: input.netCents + taxCents,
    isEstimate,
    ruleId: fallback.ruleId,
    odooFiscalPositionId: fallback.odooFiscalPositionId,
  }

  if (!isEstimate && fallback.disclaimerKey) {
    breakdown.disclaimerKey = fallback.disclaimerKey
  }

  return breakdown
}

function stripDisclaimerForUi(breakdown: TaxBreakdownDTO): TaxBreakdownDTO {
  const { disclaimerKey: _d, ...rest } = breakdown
  return rest
}

export const taxService = {
  async resolveRules() {
    return taxRepository.listEnabled()
  },

  async calculate(input: TaxCalculationInput, isEstimate: boolean): Promise<TaxBreakdownDTO> {
    const rules = await taxRepository.listEnabled()
    const vatValid = input.vatForceAccepted ? false : input.vatValid
    const rule = findMatchingTaxRule(rules, { ...input, vatValid })
    return buildTaxBreakdown(input, rule, isEstimate)
  },

  async estimateForCart(
    netCents: number,
    shippingCountry: string,
    options?: {
      customerSegment?: CustomerSegment | null
      isProfessional?: boolean | null
    },
  ): Promise<TaxBreakdownDTO> {
    const breakdown = await this.calculate(
      {
        netCents,
        shippingCountry,
        customerSegment: options?.customerSegment ?? 'RETAIL',
        isProfessional: options?.isProfessional ?? false,
        vatValid: null,
      },
      true,
    )
    return stripDisclaimerForUi(breakdown)
  },

  async calculateForCheckout(input: TaxCalculationInput): Promise<TaxBreakdownDTO> {
    const breakdown = await this.calculate(input, false)
    return stripDisclaimerForUi(breakdown)
  },

  /** Calcolo completo con disclaimer (thank-you / metadata ordine). */
  async calculateForOrder(input: TaxCalculationInput): Promise<TaxBreakdownDTO> {
    return this.calculate(input, false)
  },

  taxCentsFromNet(netCents: number, ratePct: number): number {
    return Math.round((netCents * ratePct) / 100)
  },
}

export async function seedDefaultTaxRules(): Promise<void> {
  const existing = await taxRepository.count()
  if (existing > 0) return

  const rules: Array<Parameters<typeof taxRepository.create>[0]> = [
    {
      priority: 100,
      customerSegment: 'BUSINESS',
      shippingCountry: 'EU_EXCL_IT',
      vatValid: true,
      taxRatePct: 0,
      taxLabel: 'Reverse charge',
      odooFiscalPositionId: null,
    },
    {
      priority: 90,
      customerSegment: 'PROFESSIONAL',
      shippingCountry: 'EU_EXCL_IT',
      vatValid: true,
      taxRatePct: 0,
      taxLabel: 'Reverse charge',
      odooFiscalPositionId: null,
    },
    {
      priority: 85,
      customerSegment: 'BUSINESS',
      shippingCountry: 'IT',
      vatValid: true,
      taxRatePct: 22,
      taxLabel: 'IVA 22%',
    },
    {
      priority: 80,
      customerSegment: 'RETAIL',
      shippingCountry: 'IT',
      taxRatePct: 22,
      taxLabel: 'IVA 22%',
    },
    {
      priority: 75,
      customerSegment: 'BUSINESS',
      shippingCountry: 'IT',
      taxRatePct: 22,
      taxLabel: 'IVA 22%',
    },
    {
      priority: 70,
      customerSegment: 'PROFESSIONAL',
      shippingCountry: 'IT',
      taxRatePct: 22,
      taxLabel: 'IVA 22%',
    },
    {
      priority: 60,
      shippingCountry: 'EU',
      taxRatePct: 22,
      taxLabel: 'IVA 22%',
    },
    {
      priority: 50,
      shippingCountry: 'EXTRA_EU',
      taxRatePct: 0,
      taxLabel: 'Esente IVA',
      disclaimerKey: 'extra_eu_duties',
    },
  ]

  for (const rule of rules) {
    await taxRepository.create(rule)
  }
}
