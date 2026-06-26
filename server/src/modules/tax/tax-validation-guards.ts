import { AppError } from '../../types/errors.js'
import { validateFiscalCode } from './fiscal-code.validation.js'
import { validateItalianVatNumber } from './italian-vat.validation.js'
import { normalizeCountryCode } from './tax.constants.js'
import type { TaxValidationInput } from './tax-validation.types.js'

type CheckoutTaxBody = {
  customerSegment?: 'retail' | 'business'
  isProfessional?: boolean
  billingAddress: { country: string }
  business?: {
    vatNumber?: string
    fiscalCode?: string
  }
  vatValidated?: boolean
  vatForceAccepted?: boolean
}

function isBusinessCheckout(data: CheckoutTaxBody): boolean {
  return (
    data.customerSegment === 'business' ||
    data.isProfessional === true
  )
}

export function assertLocalTaxFields(body: CheckoutTaxBody): void {
  const country = normalizeCountryCode(body.billingAddress.country)
  const business = isBusinessCheckout(body)

  if (business && body.business?.vatNumber?.trim()) {
    if (country === 'IT') {
      const vat = validateItalianVatNumber(body.business.vatNumber)
      if (!vat.valid) {
        throw new AppError(
          'VAT_INVALID',
          'Invalid VAT number',
          vat.errors[0] ?? 'Partita IVA non valida.',
          400,
          false,
        )
      }
    }
  }

  const fiscalCode = body.business?.fiscalCode?.trim()
  if (fiscalCode) {
    const cf = validateFiscalCode(fiscalCode)
    if (!cf.valid) {
      throw new AppError(
        'FISCAL_CODE_INVALID',
        'Invalid fiscal code',
        cf.errors[0] ?? 'Codice fiscale non valido.',
        400,
        false,
      )
    }
  }
}

export function buildTaxValidationInput(
  body: CheckoutTaxBody,
): TaxValidationInput {
  const country = normalizeCountryCode(body.billingAddress.country)
  const business = isBusinessCheckout(body)
  return {
    countryCode: country,
    fiscalCode: body.business?.fiscalCode,
    vatNumber: body.business?.vatNumber,
    personType: business ? 'company' : 'private',
  }
}

export function assertEuVatRequirement(body: CheckoutTaxBody): void {
  const country = normalizeCountryCode(body.billingAddress.country)
  const business = isBusinessCheckout(body)
  if (!business || country === 'IT' || country.length !== 2) return

  const euExclIt = country !== 'IT' && /^[A-Z]{2}$/.test(country)
  if (!euExclIt) return

  if (!body.vatValidated && !body.vatForceAccepted) {
    throw new AppError(
      'VAT_NOT_VALIDATED',
      'VAT not validated',
      'Verifica la partita IVA su VIES prima di proseguire.',
      400,
      false,
    )
  }
}
