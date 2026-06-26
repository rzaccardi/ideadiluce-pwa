export type ProductSpecRow = {
  label: string
  value: string
  href?: string | null
}

function cellTextToPlain(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&gt;/gi, '>')
    .replace(/&lt;/gi, '<')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

function cellTextOrLink(html: string): { value: string; href?: string | null } {
  const href = html.match(/href\s*=\s*["']([^"']+)["']/i)?.[1]?.trim()
  if (href) return { value: cellTextToPlain(html) || href, href }
  const plain = cellTextToPlain(html)
  if (/^https?:\/\//i.test(plain)) return { value: plain, href: plain }
  return { value: plain }
}

export function normalizeSpecLabel(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

/** Estrae righe label/valore da tabella HTML specs (Arfly o Hub). */
export function parseProductSpecRows(tableHtml: string | null | undefined): ProductSpecRow[] {
  if (!tableHtml?.trim()) return []

  const rows: ProductSpecRow[] = []
  for (const tr of tableHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...tr[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((m) => m[1])
    if (cells.length < 2) continue
    const label = cellTextToPlain(cells[0])
    const { value, href } = cellTextOrLink(cells[1])
    if (!label || !value || /^(n\/a|na|—|-)$/i.test(value)) continue
    rows.push({ label, value, href })
  }
  return rows
}

export function findSpecValue(
  rows: ReadonlyArray<ProductSpecRow>,
  ...labelPatterns: RegExp[]
): string | null {
  for (const row of rows) {
    const normalized = normalizeSpecLabel(row.label)
    if (labelPatterns.some((re) => re.test(normalized))) return row.value
  }
  return null
}

export function findSpecRow(
  rows: ReadonlyArray<ProductSpecRow>,
  ...labelPatterns: RegExp[]
): ProductSpecRow | null {
  for (const row of rows) {
    const normalized = normalizeSpecLabel(row.label)
    if (labelPatterns.some((re) => re.test(normalized))) return row
  }
  return null
}

/** Raggruppa specs per sezione (layout tecnico). */
export function groupSpecRowsForTechnical(rows: ReadonlyArray<ProductSpecRow>) {
  const groups: Array<{ title: string; rows: ProductSpecRow[] }> = [
    { title: 'DATI PRINCIPALI', rows: [] },
    { title: 'DATI LUMINOSI', rows: [] },
    { title: 'DATI ELETTRICI', rows: [] },
    { title: 'DATI FISICI & INSTALLAZIONE', rows: [] },
  ]

  const luminousRe =
    /flusso|temperatura|colore della luce|cri|angolo|fascio|flicker|res[aà] cromatica|kelvin|lm\b/i
  const electricRe = /potenza|tensione|classe energetica|dimmer|watt|volt|hz|corrente|mA/i
  const physicalRe =
    /lunghezza|diametro|dimensioni|materiale|uso|durata|garanzia|peso|ip\b|protezione|installazione/i
  const mainRe = /tipologia|marca|brand|attacco|portalampade|ean|codice|sku|serie|designer/i

  for (const row of rows) {
    const label = row.label
    if (luminousRe.test(label)) groups[1].rows.push(row)
    else if (electricRe.test(label)) groups[2].rows.push(row)
    else if (physicalRe.test(label)) groups[3].rows.push(row)
    else if (mainRe.test(label)) groups[0].rows.push(row)
    else groups[3].rows.push(row)
  }

  return groups.filter((g) => g.rows.length > 0)
}

/** Righe attese per la scheda arredo — mantiene ordine del design con placeholder. */
export const DESIGN_SPEC_LABELS = [
  'Designer',
  'Serie',
  'Tipologia lampada',
  'Tipologia fonte luminosa',
  'Materiali',
  'Portalampade',
  'Tensione di alimentazione',
  'Colore della luce',
  'Indice di resa cromatica',
  'Dimmerabile',
  'Dimensioni',
  'Grado di protezione',
  'Produzione',
  'Manuale tecnico',
] as const

export function mergeDesignSpecRows(
  parsed: ReadonlyArray<ProductSpecRow>,
): Array<{ label: string; value: string | null; href?: string | null }> {
  const used = new Set<number>()

  return DESIGN_SPEC_LABELS.map((expectedLabel) => {
    const pattern = new RegExp(
      expectedLabel
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{M}/gu, '')
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .split(/\s+/)
        .join('.*'),
      'i',
    )

    const idx = parsed.findIndex((row, i) => !used.has(i) && pattern.test(normalizeSpecLabel(row.label)))
    if (idx >= 0) {
      used.add(idx)
      const row = parsed[idx]
      return { label: expectedLabel, value: row.value, href: row.href }
    }
    return { label: expectedLabel, value: null, href: null }
  })
}
