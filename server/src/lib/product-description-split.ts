/** Estrae tabelle HTML dalla descrizione prodotto Woo per PDP strutturata. */

const TABLE_RE = /<table[\s\S]*?<\/table>/gi

function countTableRows(tableHtml: string): number {
  return (tableHtml.match(/<tr[\s>]/gi) ?? []).length
}

export function extractTablesFromHtml(html: string): string[] {
  return [...html.matchAll(TABLE_RE)].map((m) => m[0])
}

export function removeTablesFromHtml(html: string): string {
  return html.replace(TABLE_RE, '').replace(/\s+/g, ' ').trim()
}

export type SplitProductDescription = {
  descriptionHtml: string | null
  /** Tabella compatta (es. Informazioni aggiuntive) — prima tabella se piccola. */
  additionalInfoTableHtml: string | null
  /** Tabella tecnica principale — la più grande per righe. */
  specsTableHtml: string | null
}

const ADDITIONAL_INFO_MAX_ROWS = 8

export function splitProductDescription(html: string | null | undefined): SplitProductDescription {
  if (!html?.trim()) {
    return { descriptionHtml: null, additionalInfoTableHtml: null, specsTableHtml: null }
  }

  const tables = extractTablesFromHtml(html)
  if (!tables.length) {
    return { descriptionHtml: html.trim() || null, additionalInfoTableHtml: null, specsTableHtml: null }
  }

  const descriptionHtml = removeTablesFromHtml(html) || null
  const sorted = [...tables].sort((a, b) => countTableRows(b) - countTableRows(a))
  const largest = sorted[0] ?? null
  const smallest = sorted[sorted.length - 1] ?? null

  const specsTableHtml = largest
  const additionalInfoTableHtml =
    smallest && smallest !== largest && countTableRows(smallest) <= ADDITIONAL_INFO_MAX_ROWS
      ? smallest
      : largest && countTableRows(largest) <= ADDITIONAL_INFO_MAX_ROWS
        ? largest
        : null

  return { descriptionHtml, additionalInfoTableHtml, specsTableHtml }
}
