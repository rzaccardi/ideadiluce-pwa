/** VIES restituisce spesso "---" quando non espone il dato. */
const VIES_PLACEHOLDERS = new Set(['---', '-', 'N/A', 'NA', ''])

export function isUsableViesText(value: string | null | undefined): value is string {
  if (!value) return false
  const trimmed = value.trim()
  if (!trimmed || VIES_PLACEHOLDERS.has(trimmed.toUpperCase())) return false
  return true
}

export function pickViesCompanyName(
  viesName: string | null | undefined,
  currentCompanyName?: string | null,
): string | null {
  if (!isUsableViesText(viesName)) return currentCompanyName?.trim() || null
  return viesName.trim()
}

export function sanitizeViesField(value: string | null | undefined): string | null {
  return isUsableViesText(value) ? value.trim() : null
}

export type ParsedViesAddress = {
  line1: string | null
  line2: string | null
  city: string | null
  postalCode: string | null
}

/** Parsing euristico indirizzo VIES (multilinea, formati EU vari). */
export function parseViesAddress(raw: string | null | undefined): ParsedViesAddress {
  if (!isUsableViesText(raw)) {
    return { line1: null, line2: null, city: null, postalCode: null }
  }

  const lines = raw
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)

  if (lines.length === 0) {
    return { line1: null, line2: null, city: null, postalCode: null }
  }

  if (lines.length === 1) {
    return { line1: lines[0]!, line2: null, city: null, postalCode: null }
  }

  const last = lines[lines.length - 1]!
  const zipCityMatch = last.match(/^(\d{4,10})\s+(.+)$/)

  return {
    line1: lines[0]!,
    line2: lines.length > 2 ? lines.slice(1, -1).join(', ') : null,
    postalCode: zipCityMatch?.[1] ?? null,
    city: zipCityMatch?.[2] ?? last,
  }
}

export function buildViesOdooComment(
  viesName: string | null | undefined,
  viesAddress: string | null | undefined,
  requestDate?: string | null,
): string | null {
  const name = sanitizeViesField(viesName)
  const address = sanitizeViesField(viesAddress)
  if (!name && !address) return null
  const parts = ['[VIES]']
  if (requestDate) parts.push(`Verificato: ${requestDate}`)
  if (name) parts.push(`Denominazione: ${name}`)
  if (address) parts.push(`Indirizzo: ${address.replace(/\n/g, ', ')}`)
  return parts.join('\n')
}
