export type ItalianVatValidationResult = {
  input: string
  normalized: string
  formatValid: boolean
  checksumValid: boolean
  valid: boolean
  errors: string[]
}

export function normalizeItalianVatNumber(input: string): string {
  return input.replace(/^IT/i, '').replace(/\D/g, '')
}

export function validateItalianVatNumber(input: string): ItalianVatValidationResult {
  const normalized = normalizeItalianVatNumber(input)
  const errors: string[] = []

  if (!normalized) {
    return {
      input,
      normalized,
      formatValid: false,
      checksumValid: false,
      valid: false,
      errors: ['Partita IVA obbligatoria.'],
    }
  }

  const formatValid = /^\d{11}$/.test(normalized)
  if (!formatValid) {
    errors.push('La partita IVA deve avere 11 cifre.')
    return {
      input,
      normalized,
      formatValid: false,
      checksumValid: false,
      valid: false,
      errors,
    }
  }

  let sum = 0
  for (let i = 0; i < 10; i++) {
    let digit = Number(normalized[i])
    if (i % 2 === 1) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
  }
  const checkDigit = (10 - (sum % 10)) % 10
  const checksumValid = checkDigit === Number(normalized[10])

  if (!checksumValid) {
    errors.push('Cifra di controllo partita IVA non valida.')
  }

  return {
    input,
    normalized,
    formatValid: true,
    checksumValid,
    valid: checksumValid,
    errors,
  }
}
