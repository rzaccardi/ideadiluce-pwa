export type ParsedCodeLine = {
  code: string
  quantity: number
}

const QTY_SUFFIX =
  /^(.+?)[\s,;|\t]+(?:x|×|\*)?\s*(\d+)\s*$/i

/** Normalizza codice prodotto per confronto (EAN/SKU/MPN). */
export function normalizeProductCode(code: string): string {
  return code.trim().replace(/\s+/g, '').toUpperCase()
}

/**
 * Estrae righe `{ code, quantity }` da testo incollato.
 * Supporta: `8711500411990 ×10`, `322805 x4`, `4058075609907`, TSV da Excel.
 */
export function parseQuickReorderText(text: string): ParsedCodeLine[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  const parsed: ParsedCodeLine[] = []

  for (const line of lines) {
    const tabParts = line.split(/\t/)
    if (tabParts.length >= 2) {
      const code = tabParts[0]?.trim()
      const qtyRaw = tabParts[1]?.trim()
      const quantity = qtyRaw ? Number.parseInt(qtyRaw, 10) : 1
      if (code && Number.isInteger(quantity) && quantity > 0) {
        parsed.push({ code, quantity })
        continue
      }
    }

    const suffixMatch = QTY_SUFFIX.exec(line)
    if (suffixMatch) {
      const code = suffixMatch[1]?.trim()
      const quantity = Number.parseInt(suffixMatch[2] ?? '1', 10)
      if (code && Number.isInteger(quantity) && quantity > 0) {
        parsed.push({ code, quantity })
        continue
      }
    }

    parsed.push({ code: line, quantity: 1 })
  }

  return parsed
}
