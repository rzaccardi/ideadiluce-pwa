import { createRequire } from 'node:module'

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

export function validateFiscalCode(input: string): FiscalCodeValidationResult {
  const normalized = normalizeFiscalCode(input)
  const errors: string[] = []

  if (!normalized) {
    return { input, normalized, valid: false, errors: ['Codice fiscale obbligatorio.'] }
  }

  if (normalized.length !== 16) {
    errors.push('Il codice fiscale deve avere 16 caratteri.')
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
