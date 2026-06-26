export type TaxValidationPersonType = 'private' | 'company'

export type ViesResponseStatus = 'valid' | 'invalid' | 'service_unavailable' | 'not_checked'

export type TaxValidationInput = {
  countryCode: string
  fiscalCode?: string
  vatNumber?: string
  personType: TaxValidationPersonType
}

export type FiscalCodeResult = {
  input: string
  normalized: string
  valid: boolean
  errors: string[]
}

export type VatResult = {
  input: string
  countryCode: string
  normalized: string
  formatValid: boolean
  checksumValid: boolean
  vies: {
    checked: boolean
    valid: boolean | null
    name: string | null
    address: string | null
    requestDate: string | null
    status: ViesResponseStatus
  }
  autofill: {
    companyName: string | null
    billingLine1: string | null
    billingLine2: string | null
    billingCity: string | null
    billingPostalCode: string | null
  }
  errors: string[]
}

export type TaxValidationResult = {
  fiscalCode: FiscalCodeResult | null
  vat: VatResult | null
  taxValidationStatus: 'pending' | 'valid' | 'invalid' | 'vies_unavailable'
}

export type TaxValidationContext = {
  userId?: string | null
  sessionId?: string | null
  correlationId?: string
}
