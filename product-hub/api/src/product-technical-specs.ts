/**
 * Caratteristiche tecniche prodotto: campi strutturati e generazione tabella HTML PDP.
 */

export const TECH_SPEC_FIELDS = [
  'productCode',
  'lightSource',
  'lampType',
  'lampHolder',
  'power',
  'lightColor',
  'colorRenderingIndex',
  'luminousFlux',
  'dimmable',
  'energyClass',
  'estimatedLifetime',
  'dimensions',
  'production',
  'technicalManual',
] as const

export type TechnicalSpecFieldKey = (typeof TECH_SPEC_FIELDS)[number]

export type ProductTechnicalSpecs = {
  specsIntro: string | null
} & Record<TechnicalSpecFieldKey, string | null>

export const TECH_SPEC_LABELS_IT: Record<TechnicalSpecFieldKey, string> = {
  productCode: 'Codice prodotto',
  lightSource: 'Fonte luminosa',
  lampType: 'Tipologia lampada',
  lampHolder: 'Portalampade',
  power: 'Potenza',
  lightColor: 'Colore della luce',
  colorRenderingIndex: 'Indice di resa cromatica',
  luminousFlux: 'Flusso luminoso',
  dimmable: 'Dimmerabile',
  energyClass: 'Classe energetica',
  estimatedLifetime: 'Durata stimata',
  dimensions: 'Dimensioni',
  production: 'Produzione',
  technicalManual: 'Manuale tecnico',
}

const LABEL_TO_FIELD: Record<string, TechnicalSpecFieldKey> = {
  'codice prodotto': 'productCode',
  codice: 'productCode',
  'fonte luminosa': 'lightSource',
  'tipologia lampada': 'lampType',
  portalampade: 'lampHolder',
  potenza: 'power',
  'colore della luce': 'lightColor',
  'indice di resa cromatica': 'colorRenderingIndex',
  'flusso luminoso': 'luminousFlux',
  dimmerabile: 'dimmable',
  'classe energetica': 'energyClass',
  'durata stimata': 'estimatedLifetime',
  dimensioni: 'dimensions',
  produzione: 'production',
  'manuale tecnico': 'technicalManual',
}

export function emptyTechnicalSpecs(): ProductTechnicalSpecs {
  return {
    specsIntro: null,
    productCode: null,
    lightSource: null,
    lampType: null,
    lampHolder: null,
    power: null,
    lightColor: null,
    colorRenderingIndex: null,
    luminousFlux: null,
    dimmable: null,
    energyClass: null,
    estimatedLifetime: null,
    dimensions: null,
    production: null,
    technicalManual: null,
  }
}

function normalizeLabel(label: string): string {
  return label
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

export function cellTextToPlain(html: string): string {
  let s = html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&gt;/gi, '>')
    .replace(/&lt;/gi, '<')
    .replace(/&amp;/gi, '&')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, ' ')
    .trim()
  return s || ''
}

/** Estrae href da cella (es. manuale tecnico PDF). */
export function cellTextOrLink(html: string): string {
  const href = html.match(/href\s*=\s*["']([^"']+)["']/i)?.[1]?.trim()
  if (href) return href
  const plain = cellTextToPlain(html)
  if (/^https?:\/\//i.test(plain)) return plain
  return plain
}

function parseTableRows(tableHtml: string): Array<{ label: string; value: string }> {
  const rows: Array<{ label: string; value: string }> = []
  for (const tr of tableHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...tr[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((m) => m[1])
    if (cells.length >= 2) {
      rows.push({
        label: cellTextToPlain(cells[0]),
        value: cellTextOrLink(cells[1]),
      })
    }
  }
  return rows
}

export function parseSpecsFromTableHtml(tableHtml: string | null | undefined): ProductTechnicalSpecs {
  const specs = emptyTechnicalSpecs()
  if (!tableHtml?.trim()) return specs

  for (const row of parseTableRows(tableHtml)) {
    const key = LABEL_TO_FIELD[normalizeLabel(row.label)]
    if (!key || !row.value.trim()) continue
    const v = row.value.trim()
    if (/^(n\/a|na|—|-)$/i.test(v)) continue
    specs[key] = v
  }
  return specs
}

export function mergeTechnicalSpecs(
  base: ProductTechnicalSpecs,
  patch: Partial<ProductTechnicalSpecs>,
): ProductTechnicalSpecs {
  const out = { ...base }
  for (const key of [...TECH_SPEC_FIELDS, 'specsIntro'] as const) {
    if (patch[key] !== undefined) out[key] = patch[key] ?? null
  }
  return out
}

export function hasAnyTechnicalSpec(specs: ProductTechnicalSpecs): boolean {
  if (specs.specsIntro?.trim()) return true
  return TECH_SPEC_FIELDS.some((k) => Boolean(specs[k]?.trim()))
}

export function resolveSpecValue(
  specs: ProductTechnicalSpecs,
  key: TechnicalSpecFieldKey,
  sku: string | null | undefined,
): string | null {
  const v = specs[key]?.trim()
  if (v) return v
  if (key === 'productCode' && sku?.trim()) return sku.trim()
  return null
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatSpecCellValue(key: TechnicalSpecFieldKey, value: string): string {
  if (key === 'technicalManual' && /^https?:\/\//i.test(value)) {
    return `<a href="${escapeHtml(value)}" target="_blank" rel="noopener noreferrer">Scarica PDF</a>`
  }
  return escapeHtml(value)
}

/** Tabella HTML solo con righe compilate (stile Woo legacy). */
export function renderTechnicalSpecsTableHtml(
  specs: ProductTechnicalSpecs,
  options?: { sku?: string | null },
): string | null {
  const rows: Array<{ label: string; value: string }> = []
  for (const key of TECH_SPEC_FIELDS) {
    const value = resolveSpecValue(specs, key, options?.sku)
    if (!value) continue
    rows.push({
      label: TECH_SPEC_LABELS_IT[key],
      value: formatSpecCellValue(key, value),
    })
  }
  if (!rows.length && !specs.specsIntro?.trim()) return null

  const intro = specs.specsIntro?.trim()
    ? `<p>${escapeHtml(specs.specsIntro.trim())}</p>`
    : ''

  const body = rows
    .map((row, i) => {
      const bg = i % 2 === 0 ? 'white' : '#f8f8f8'
      return `<tr style="background-color: ${bg}">
                <td style="border: medium;width: 44.021%">${escapeHtml(row.label)}</td>
                <td style="border: medium;font-weight: bold;width: 54.9277%">${row.value}</td>
              </tr>`
    })
    .join('')

  const tableBlock = rows.length
    ? `<div style="text-align: center">
    <table style="border-collapse: separate;border: 1px solid white;width: 100%;margin-left: auto;margin-right: auto">
      <tbody>${body}</tbody>
    </table>
  </div>`
    : ''

  return `${intro}${tableBlock}`.trim() || null
}

const SPECS_HEADING_RE =
  /<h3[^>]*>\s*caratteristiche\s+tecniche\s*<\/h3>/gi

/** Rimuove sezione Caratteristiche Tecniche (titolo, intro, tabelle) dalla descrizione. */
export function stripTechnicalSpecsFromDescription(html: string | null | undefined): string | null {
  if (!html?.trim()) return null

  let s = html
  s = s.replace(SPECS_HEADING_RE, '')
  s = s.replace(/<table[\s\S]*?<\/table>/gi, '')
  s = s.replace(/&nbsp;/gi, ' ')
  s = s.replace(/\s+/g, ' ').trim()
  return s || null
}

/** Estrae paragrafo introduttivo subito prima della prima tabella tecnica. */
export function extractSpecsIntroFromHtml(html: string): string | null {
  const tableIdx = html.search(/<table[\s>]/i)
  if (tableIdx < 0) return null
  const before = html.slice(0, tableIdx)
  const pMatches = [...before.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
  const last = pMatches[pMatches.length - 1]
  if (!last) return null
  const text = cellTextToPlain(last[1])
  if (!text || text.length > 500) return null
  return text
}

export type TechnicalSpecsFromDescription = {
  specs: ProductTechnicalSpecs
  descriptionHtml: string | null
}

export function extractTechnicalSpecsFromDescription(
  html: string | null | undefined,
  existing?: Partial<ProductTechnicalSpecs> | null,
): TechnicalSpecsFromDescription {
  const base = mergeTechnicalSpecs(emptyTechnicalSpecs(), existing ?? {})
  if (!html?.trim()) {
    return { specs: base, descriptionHtml: null }
  }

  const tables = [...html.matchAll(/<table[\s\S]*?<\/table>/gi)].map((m) => m[0])
  const sorted = [...tables].sort(
    (a, b) => (b.match(/<tr[\s>]/gi) ?? []).length - (a.match(/<tr[\s>]/gi) ?? []).length,
  )
  const mainTable = sorted[0]
  const parsed = mainTable ? parseSpecsFromTableHtml(mainTable) : emptyTechnicalSpecs()
  const specsIntro = base.specsIntro?.trim() || extractSpecsIntroFromHtml(html) || null

  const specs = mergeTechnicalSpecs(base, {
    ...parsed,
    specsIntro: specsIntro || base.specsIntro,
  })

  let descriptionHtml = stripTechnicalSpecsFromDescription(html)
  if (specs.specsIntro && descriptionHtml?.includes(specs.specsIntro)) {
    descriptionHtml = descriptionHtml.replace(specs.specsIntro, '').replace(/\s+/g, ' ').trim() || null
  }

  return { specs, descriptionHtml: descriptionHtml || null }
}
