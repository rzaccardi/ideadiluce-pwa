import { validateFiscalCode } from './fiscal-code.validation.js'
import { validateItalianVatNumber } from './italian-vat.validation.js'
import { taxValidationRepository } from './tax-validation.repository.js'
import type {
  TaxValidationContext,
  TaxValidationInput,
  TaxValidationResult,
  VatResult,
} from './tax-validation.types.js'
import { isEuCountry, normalizeCountryCode } from './tax.constants.js'
import { vatCacheRepository } from './vat-cache.repository.js'
import { checkVies } from './vies.client.js'
import {
  parseViesAddress,
  pickViesCompanyName,
  sanitizeViesField,
} from './vies-utils.js'

function parseVatNumber(
  raw: string,
  countryHint: string,
): { countryCode: string; vatNumber: string } {
  const cleaned = raw.replace(/[\s.-]/g, '').toUpperCase()
  const prefix = cleaned.slice(0, 2)
  if (/^[A-Z]{2}$/.test(prefix) && cleaned.length > 2 && isEuCountry(prefix)) {
    return { countryCode: prefix, vatNumber: cleaned.slice(2) }
  }
  const countryCode = normalizeCountryCode(countryHint)
  return { countryCode, vatNumber: cleaned.replace(/^[A-Z]{2}/, '') }
}

function validateVatFormat(countryCode: string, vatNumber: string): {
  formatValid: boolean
  checksumValid: boolean
  normalized: string
  errors: string[]
} {
  if (countryCode === 'IT') {
    const result = validateItalianVatNumber(vatNumber)
    return {
      formatValid: result.formatValid,
      checksumValid: result.checksumValid,
      normalized: result.normalized,
      errors: result.errors,
    }
  }

  const normalized = vatNumber.replace(/\D/g, '')
  const formatValid = normalized.length >= 4 && normalized.length <= 14
  return {
    formatValid,
    checksumValid: formatValid,
    normalized,
    errors: formatValid ? [] : ['Formato partita IVA non valido.'],
  }
}

async function resolveVies(
  countryCode: string,
  vatNumber: string,
  formatValid: boolean,
  checksumValid: boolean,
  personType: TaxValidationInput['personType'],
  correlationId?: string,
): Promise<VatResult['vies']> {
  const shouldCheck =
    personType === 'company' &&
    isEuCountry(countryCode) &&
    formatValid &&
    checksumValid

  if (!shouldCheck) {
    return {
      checked: false,
      valid: null,
      name: null,
      address: null,
      requestDate: null,
      status: 'not_checked',
    }
  }

  const cached = await vatCacheRepository.get(countryCode, vatNumber)
  if (cached) {
    const name = sanitizeViesField(cached.name)
    const address = sanitizeViesField(cached.address)
    return {
      checked: true,
      valid: cached.valid,
      name,
      address,
      requestDate: cached.requestDate,
      status: cached.valid ? 'valid' : 'invalid',
    }
  }

  const vies = await checkVies(countryCode, vatNumber, correlationId)
  if (vies.status === 'service_unavailable') {
    return {
      checked: false,
      valid: null,
      name: null,
      address: null,
      requestDate: null,
      status: 'service_unavailable',
    }
  }

  await vatCacheRepository.set(countryCode, vatNumber, vies)

  return {
    checked: true,
    valid: vies.valid,
    name: sanitizeViesField(vies.name),
    address: sanitizeViesField(vies.address),
    requestDate: vies.requestDate ?? null,
    status: vies.status,
  }
}

function buildVatAutofill(vies: VatResult['vies']): VatResult['autofill'] {
  const companyName = pickViesCompanyName(vies.name)
  const parsed = parseViesAddress(vies.address)
  return {
    companyName,
    billingLine1: parsed.line1,
    billingLine2: parsed.line2,
    billingCity: parsed.city,
    billingPostalCode: parsed.postalCode,
  }
}

function computeTaxValidationStatus(result: TaxValidationResult): TaxValidationResult['taxValidationStatus'] {
  const fiscalInvalid = result.fiscalCode != null && !result.fiscalCode.valid
  const vatLocalInvalid =
    result.vat != null && (!result.vat.formatValid || !result.vat.checksumValid)
  const viesInvalid =
    result.vat?.vies.checked === true &&
    result.vat.vies.status === 'invalid' &&
    result.vat.countryCode !== 'IT'
  const viesUnavailable = result.vat?.vies.status === 'service_unavailable'

  if (fiscalInvalid || vatLocalInvalid || viesInvalid) return 'invalid'
  if (viesUnavailable) return 'vies_unavailable'

  const fiscalOk = result.fiscalCode == null || result.fiscalCode.valid
  const vatOk =
    result.vat == null ||
    (result.vat.formatValid &&
      result.vat.checksumValid &&
      (result.vat.countryCode === 'IT' ||
        result.vat.vies.status === 'not_checked' ||
        result.vat.vies.status === 'valid' ||
        result.vat.vies.status === 'service_unavailable'))

  if (fiscalOk && vatOk) return 'valid'
  return 'pending'
}

export const taxValidationService = {
  async validate(input: TaxValidationInput, ctx: TaxValidationContext = {}): Promise<TaxValidationResult> {
    const countryCode = normalizeCountryCode(input.countryCode)

    let fiscalCodeResult = null
    if (input.fiscalCode?.trim()) {
      fiscalCodeResult = validateFiscalCode(input.fiscalCode)
    }

    let vatResult: VatResult | null = null
    if (input.vatNumber?.trim()) {
      const parsed = parseVatNumber(input.vatNumber, countryCode)
      const local = validateVatFormat(parsed.countryCode, parsed.vatNumber)
      const vies = await resolveVies(
        parsed.countryCode,
        local.normalized,
        local.formatValid,
        local.checksumValid,
        input.personType,
        ctx.correlationId,
      )

      vatResult = {
        input: input.vatNumber,
        countryCode: parsed.countryCode,
        normalized: local.normalized,
        formatValid: local.formatValid,
        checksumValid: local.checksumValid,
        vies,
        autofill: buildVatAutofill(vies),
        errors: local.errors,
      }
    }

    const partial: TaxValidationResult = {
      fiscalCode: fiscalCodeResult,
      vat: vatResult,
      taxValidationStatus: 'pending',
    }
    partial.taxValidationStatus = computeTaxValidationStatus(partial)

    const provider = vatResult?.vies.checked ? 'vies' : 'local'
    await taxValidationRepository.writeLog(ctx, partial, provider, partial.taxValidationStatus)

    if (ctx.userId) {
      await taxValidationRepository.persistUserVerification(ctx.userId, partial)
    }

    return partial
  },

  validateFiscalCodeLocal(input: string) {
    return validateFiscalCode(input)
  },

  validateItalianVatLocal(input: string) {
    return validateItalianVatNumber(input)
  },
}
