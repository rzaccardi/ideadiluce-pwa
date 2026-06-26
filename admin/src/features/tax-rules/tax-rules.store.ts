import { proxy } from 'valtio'

export type TaxRuleRow = {
  id: string
  priority: number
  customerSegment: 'RETAIL' | 'BUSINESS' | 'PROFESSIONAL' | null
  isProfessional: boolean | null
  billingCountry: string | null
  shippingCountry: string
  vatValid: boolean | null
  taxRatePct: number
  taxLabel: string
  disclaimerKey: string | null
  odooFiscalPositionId: number | null
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export const taxRulesStore = proxy({
  rules: [] as TaxRuleRow[],
  isLoading: false,
  error: null as string | null,
})
