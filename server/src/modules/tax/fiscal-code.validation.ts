import { createRequire } from 'node:module'
import { validateItalianVatNumber } from './italian-vat.validation.js'

const require = createRequire(import.meta.url)
const CodiceFiscale = require('codice-fiscale-js') as {
  check: (codiceFiscale: string) => boolean
}

export type FiscalCodeValidationResult = {
  input: string
  normalized: string
  valid: boolean
  errors: string[]
}

export function normalizeFiscalCode(input: string): string {
  return input.trim().replace(/\s/g, '').toUpperCase()
}

/**
 * Accetta CF persona (16) o CF azienda/ente (11 cifre, stesso algoritmo della P.IVA).
 * Su Odoo il campo corrispondente è `l10n_it_codice_fiscale`.
 */
export function validateFiscalCode(input: string): FiscalCodeValidationResult {
  const normalized = normalizeFiscalCode(input)

  if (!normalized) {
    return { input, normalized, valid: false, errors: ['Codice fiscale obbligatorio.'] }
  }

  if (/^\d{11}$/.test(normalized)) {
    const vat = validateItalianVatNumber(normalized)
    return {
      input,
      normalized,
      valid: vat.valid,
      errors: vat.valid
        ? []
        : vat.errors.map((e) => e.replace(/partita IVA/gi, 'codice fiscale')),
    }
  }

  const errors: string[] = []

  if (normalized.length !== 16) {
    errors.push('Il codice fiscale deve avere 11 o 16 caratteri.')
  }

  if (!/^[A-Z0-9]{16}$/.test(normalized)) {
    errors.push('Formato codice fiscale non valido.')
  }

  const checksumValid = CodiceFiscale.check(normalized)
  if (!checksumValid && errors.length === 0) {
    errors.push('Codice fiscale non valido.')
  }

  return {
    input,
    normalized,
    valid: checksumValid && errors.length === 0,
    errors,
  }
}
