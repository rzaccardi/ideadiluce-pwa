export type ProductSpecRow = {
  label: string
  value: string
  href?: string | null
  /** Key Odoo (es. `diameter_mm`) — utile per riconoscere misure. */
  key?: string
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

export function specsToRows(
  specs: ReadonlyArray<{ label: string; display: string; key?: string }> | null | undefined,
): ProductSpecRow[] {
  if (!specs?.length) return []
  return specs
    .filter((s) => s.label?.trim() && s.display?.trim())
    .map((s) => ({
      label: s.label,
      value: s.display,
      ...(s.key?.trim() ? { key: s.key.trim() } : {}),
    }))
}

/** Estrae righe label/valore da tabella HTML specs (OdooCatalog o Hub). */
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

/** Righe attese per la scheda arredo — ordine preferito; le altre specs Odoo vengono appendate. */
export const DESIGN_SPEC_LABELS = [
  'Designer',
  'Serie',
  'Anno di progettazione',
  'Stile',
  'Tipologia lampada',
  'Tipologia fonte luminosa',
  'Materiali',
  'Portalampade',
  'Attacco',
  'Wattaggio',
  'Tensione di alimentazione',
  'Colore della luce',
  'Indice di resa cromatica',
  'Dimmerabile',
  'Numero punti luce',
  'Sorgente inclusa',
  'Dimensioni',
  'Grado di protezione',
  'Produzione',
  'Manuale tecnico',
] as const

/** Meta editoriali da evidenziare in hero (non solo in tabella). */
export const DESIGN_HERO_META_LABELS = [
  'Designer',
  'Serie',
  'Anno di progettazione',
  'Stile',
  'Materiali',
  'Wattaggio',
  'Attacco',
] as const

/** Alias Odoo → label canoniche (match flessibile). */
const DESIGN_SPEC_MATCHERS: Record<string, RegExp> = {
  Designer: /designer/,
  Serie: /serie|collection|collezione/,
  'Anno di progettazione': /anno.*(progett|design)|design.?year/,
  Stile: /^stile$|^style$/,
  'Tipologia lampada': /tipologia.*lamp|lamp.?type|tipo.?lamp/,
  'Tipologia fonte luminosa': /fonte.*lumin|light.?source|tipologia.*fonte/,
  Materiali: /material/,
  Portalampade: /portalampade/,
  Attacco: /^attacco$|socket.?type/,
  Wattaggio: /wattaggio|potenza|wattage|^power$|watt\b/,
  'Tensione di alimentazione': /tensione|voltage|volt/,
  'Colore della luce': /colore.*luce|temperatura.*colore|kelvin|color.?temp/,
  'Indice di resa cromatica': /resa.*cromatica|^cri$|color.?rendering/,
  Dimmerabile: /dimmer/,
  'Numero punti luce': /punti.?luce|light.?points|numero.*luce/,
  'Sorgente inclusa': /sorgente.*inclus|source.*includ|lampadina.*inclus/,
  Dimensioni: /^dimensioni$|^dimensions$/,
  'Grado di protezione': /grado.*protezione|^ip\b|ingress.?protection/,
  Produzione: /^produzione$|^production$|made.?in|origine/,
  'Manuale tecnico': /manuale|datasheet|scheda.*tecnica/,
}

function designSpecMatcher(expectedLabel: string): RegExp {
  return (
    DESIGN_SPEC_MATCHERS[expectedLabel] ??
    new RegExp(
      expectedLabel
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{M}/gu, '')
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .split(/\s+/)
        .join('.*'),
      'i',
    )
  )
}

/**
 * Ordina le specs arredo: prima le label canoniche (se presenti),
 * poi **tutte** le altre specs Odoo non ancora usate (niente drop).
 * Le misure spaziali restano al pannello Dimensioni (filtrate in UI).
 */
export function mergeDesignSpecRows(
  parsed: ReadonlyArray<ProductSpecRow>,
): Array<{ label: string; value: string | null; href?: string | null; key?: string }> {
  const used = new Set<number>()

  const preferred = DESIGN_SPEC_LABELS.map((expectedLabel) => {
    const pattern = designSpecMatcher(expectedLabel)
    const idx = parsed.findIndex(
      (row, i) =>
        !used.has(i) &&
        (pattern.test(normalizeSpecLabel(row.label)) ||
          (row.key != null && pattern.test(normalizeSpecLabel(row.key)))),
    )
    if (idx >= 0) {
      used.add(idx)
      const row = parsed[idx]
      return {
        label: row.label?.trim() || expectedLabel,
        value: row.value,
        href: row.href,
        key: row.key,
      }
    }
    return { label: expectedLabel, value: null, href: null }
  })

  const extras = parsed
    .map((row, i) => ({ row, i }))
    .filter(({ i }) => !used.has(i))
    .filter(({ row }) => Boolean(row.value?.trim()))
    .map(({ row }) => ({
      label: row.label,
      value: row.value,
      href: row.href ?? null,
      key: row.key,
    }))

  return [...preferred, ...extras]
}

/** Chip hero arredo: match flessibile sulle label canoniche (anche se Odoo usa nomi diversi). */
export function pickDesignHeroMeta(
  rows: ReadonlyArray<{ label: string; value: string | null; key?: string }>,
): Array<{ label: string; value: string }> {
  const used = new Set<number>()
  const out: Array<{ label: string; value: string }> = []

  for (const canonical of DESIGN_HERO_META_LABELS) {
    const pattern = designSpecMatcher(canonical)
    const idx = rows.findIndex(
      (row, i) =>
        !used.has(i) &&
        Boolean(row.value?.trim()) &&
        (pattern.test(normalizeSpecLabel(row.label)) ||
          (row.key != null && pattern.test(normalizeSpecLabel(row.key)))),
    )
    if (idx < 0) continue
    used.add(idx)
    const row = rows[idx]
    out.push({
      label: row.label?.trim() || canonical,
      value: row.value!.trim(),
    })
  }

  return out
}

/**
 * Unisce specs template + variante: la variante sovrascrive per key o label normalizzata.
 * Evita di perdere le caratteristiche del template quando la variante ha solo misure.
 */
export function mergeProductAndVariantSpecs(input: {
  productSpecs?: ReadonlyArray<{ label: string; display: string; key?: string }> | null
  variantSpecs?: ReadonlyArray<{ label: string; display: string; key?: string }> | null
  specsTableHtml?: string | null
}): ProductSpecRow[] {
  const fromProduct = specsToRows(input.productSpecs)
  const fromVariant = specsToRows(input.variantSpecs)
  if (!fromProduct.length && !fromVariant.length) {
    return parseProductSpecRows(input.specsTableHtml)
  }

  const byId = new Map<string, ProductSpecRow>()
  const idFor = (row: ProductSpecRow) =>
    row.key?.trim()
      ? `k:${row.key.trim().toLowerCase()}`
      : `l:${normalizeSpecLabel(row.label)}`

  for (const row of fromProduct) byId.set(idFor(row), row)
  for (const row of fromVariant) byId.set(idFor(row), row)
  return [...byId.values()]
}

export const DIMENSION_SPEC_LABEL_RE =
  /dimensioni|larghezza|profondit|altezza|diametro|lunghezza|ingombr|spessore|raggio|^peso$|largh\.?|prof\.?|^alt\.?$|ø|diameter|^width$|^height$|^depth$|^length$|^weight$|misure/i

/** Key Odoo tipiche per misure. */
export const DIMENSION_SPEC_KEY_RE =
  /diameter|width|height|length|depth|weight|dimension|ingomb|spess|raggio|misur|_(mm|cm|kg|m)$/i

/** Tag gallery Odoo per lo schema dimensioni (case-insensitive + alias). */
export function isMeasureGalleryTag(tag: string | null | undefined): boolean {
  const t = (tag || '').trim().toLowerCase()
  return t === 'misure' || t === 'misura' || t === 'dimensions' || t === 'dimensioni'
}

export function isDimensionSpecLabel(label: string, key?: string | null): boolean {
  const normalized = normalizeSpecLabel(label)
  if (DIMENSION_SPEC_LABEL_RE.test(normalized)) return true
  // Abbreviazioni tipo «Largh.», «Prof.», «Alt.», «Diam.»
  if (/^(largh|prof|alt|diam|lungh|spess|ingomb)\.?$/.test(normalized)) return true
  if (key?.trim() && DIMENSION_SPEC_KEY_RE.test(key.trim())) return true
  return false
}

/** Ordine preferito per le righe dimensioni nel pannello. */
const DIMENSION_LABEL_ORDER = [
  'dimensioni',
  'lunghezza',
  'larghezza',
  'profondita',
  'altezza',
  'diametro',
  'raggio',
  'spessore',
  'ingombro',
  'peso',
] as const

function dimensionSortKey(label: string): number {
  const n = normalizeSpecLabel(label)
  const idx = DIMENSION_LABEL_ORDER.findIndex((token) => n.includes(token))
  return idx >= 0 ? idx : DIMENSION_LABEL_ORDER.length
}

/** Tutte le specs dimensionali disponibili (dedup per key Odoo o label). */
export function collectDimensionSpecRows(
  rows: ReadonlyArray<ProductSpecRow>,
): ProductSpecRow[] {
  const byId = new Map<string, ProductSpecRow>()
  for (const row of rows) {
    if (!row.value?.trim() || !isDimensionSpecLabel(row.label, row.key)) continue
    const id = row.key?.trim()
      ? `k:${row.key.trim().toLowerCase()}`
      : `l:${normalizeSpecLabel(row.label)}`
    if (!byId.has(id)) byId.set(id, row)
  }
  return [...byId.values()].sort(
    (a, b) => dimensionSortKey(a.label) - dimensionSortKey(b.label) || a.label.localeCompare(b.label),
  )
}

/**
 * Unisce tutti i campi dimensionali disponibili sul prodotto:
 * `dimensions` strutturato, `weightKg`, `lengthMeters`, specs (anche per key),
 * e attributi variante dimensionali (Dimensioni, Larghezza, Altezza, …).
 */
export function buildAllProductDimensionRows(input: {
  dimensions?: { lengthCm?: number; widthCm?: number; heightCm?: number } | null
  weightKg?: number | null
  lengthMeters?: number | null
  specRows?: ReadonlyArray<ProductSpecRow> | null
  variantAttributes?: ReadonlyArray<{ name: string; value: string }> | null
}): ProductSpecRow[] {
  const fromProduct: ProductSpecRow[] = []

  const d = input.dimensions
  if (d?.lengthCm != null && Number.isFinite(d.lengthCm)) {
    fromProduct.push({ label: 'Lunghezza', value: `${d.lengthCm} cm`, key: 'length_cm' })
  }
  if (d?.widthCm != null && Number.isFinite(d.widthCm)) {
    fromProduct.push({ label: 'Larghezza', value: `${d.widthCm} cm`, key: 'width_cm' })
  }
  if (d?.heightCm != null && Number.isFinite(d.heightCm)) {
    fromProduct.push({ label: 'Altezza', value: `${d.heightCm} cm`, key: 'height_cm' })
  }
  if (
    input.lengthMeters != null &&
    Number.isFinite(input.lengthMeters) &&
    !fromProduct.some((r) => normalizeSpecLabel(r.label) === 'lunghezza')
  ) {
    const cm = Math.round(input.lengthMeters * 1000) / 10
    fromProduct.push({
      label: 'Lunghezza',
      value: `${cm} cm`,
      key: 'length_m',
    })
  }
  if (input.weightKg != null && Number.isFinite(input.weightKg)) {
    fromProduct.push({ label: 'Peso', value: `${input.weightKg} kg`, key: 'weight_kg' })
  }

  for (const attr of input.variantAttributes ?? []) {
    const name = attr.name?.trim() ?? ''
    const value = attr.value?.trim()
    if (!name || !value) continue

    const nameIsDimension = isDimensionSpecLabel(name) || /dimensioni|misur|size|ingomb/i.test(name)
    if (!nameIsDimension) continue

    // Attributo generico «Dimensioni» / «Size»: solo valori misura (no Cluster)
    const isGenericSizeAttr = /dimensioni|misur|size|ingomb/i.test(name)
    const looksLikeMeasure = /^\d+([.,]\d+)?\s*(cm|mm|m|Ø|ø)?\s*$/i.test(value)
    if (isGenericSizeAttr && !looksLikeMeasure) continue

    fromProduct.push({
      label: isGenericSizeAttr ? 'Dimensioni' : name,
      value,
      key: `variant_${normalizeSpecLabel(name).replace(/\s+/g, '_')}`,
    })
  }

  return collectDimensionSpecRows([...(input.specRows ?? []), ...fromProduct])
}
