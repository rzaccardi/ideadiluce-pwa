/**
 * Tassonomie path-based: listing catalogo sull’URL dedicato
 * (es. /attacco/gu10) con H1 dinamico, senza redirect a /negozio.
 */

export type CatalogTaxonomyKind =
  | 'attacco'
  | 'tipologia'
  | 'stile'
  | 'ambiente'
  | 'brand'
  | 'category'
  | 'tag'

export type CatalogTaxonomyContext = {
  kind: CatalogTaxonomyKind
  /** Valore inviato a search/filters. */
  value: string
  /** Label UI (es. GU10, Moderno). */
  label: string
  world?: 'design' | 'technical'
  hubPath: string
  hubLabel: string
}

const ATTACCO_CODE_ALIASES: Record<string, string> = {
  'gu5-3': 'GU5.3',
  gu53: 'GU5.3',
  r7s: 'R7s',
  g13: 'G13',
  t8: 'G13',
  gx53: 'GX53',
  '2g11': '2G11',
  g24: 'G24',
}

/** Path slug → codice attacco API (GU10, GU5.3…). */
export function resolveAttaccoCodeFromPathSlug(slug: string): string {
  const key = slug.trim().toLowerCase()
  return ATTACCO_CODE_ALIASES[key] ?? slug.trim().toUpperCase()
}

/** Codice attacco → slug path (/attacco/gu5-3). */
export function attaccoPathSlugFromCode(code: string): string {
  const normalized = code.trim()
  if (/^gu5[\-.]?3$/i.test(normalized)) return 'gu5-3'
  if (/^r7s$/i.test(normalized)) return 'r7s'
  if (/^g13$/i.test(normalized) || /^t8$/i.test(normalized)) return 'g13'
  if (/^gx53$/i.test(normalized)) return 'gx53'
  if (/^2g11$/i.test(normalized)) return '2g11'
  if (/^g24$/i.test(normalized)) return 'g24'
  return normalized.toLowerCase().replace(/\s+/g, '-')
}

export function taxonomyPageTitle(ctx: CatalogTaxonomyContext): string {
  const label = ctx.label.charAt(0).toUpperCase() + ctx.label.slice(1)
  switch (ctx.kind) {
    case 'attacco':
      return `Attacco ${ctx.label}`
    case 'tipologia':
      return label
    case 'stile':
      return `Stile ${label}`
    case 'ambiente':
      return label
    case 'brand':
      return ctx.label
    case 'category':
      return label
    case 'tag':
      return label
    default:
      return ctx.label
  }
}

export function taxonomyPath(kind: CatalogTaxonomyKind, slug: string): string {
  const s = slug.trim().replace(/^\/+|\/+$/g, '')
  switch (kind) {
    case 'attacco':
      return `/attacco/${s}`
    case 'tipologia':
      return `/tipologia/${s}`
    case 'stile':
      return `/stile/${s}`
    case 'ambiente':
      return `/ambienti/${s}`
    case 'brand':
      return `/brand/${s}`
    case 'category':
      return `/categoria-tecnica/${s}`
    case 'tag':
      return `/tag/${s}`
  }
}

export function buildAttaccoTaxonomy(pathSlug: string): CatalogTaxonomyContext {
  const value = resolveAttaccoCodeFromPathSlug(pathSlug)
  return {
    kind: 'attacco',
    value,
    label: value,
    world: 'technical',
    hubPath: '/attacco',
    hubLabel: 'Attacco',
  }
}

export function buildTipologiaTaxonomy(slug: string): CatalogTaxonomyContext {
  const value = slug.trim().toLowerCase()
  return {
    kind: 'tipologia',
    value,
    label: value,
    world: 'design',
    hubPath: '/categoria-prodotto/illuminazione-arredo',
    hubLabel: 'Tipologia',
  }
}

export function buildStileTaxonomy(slug: string): CatalogTaxonomyContext {
  const value = slug.trim().toLowerCase()
  return {
    kind: 'stile',
    value,
    label: value,
    world: 'design',
    hubPath: '/categoria-prodotto/illuminazione-arredo',
    hubLabel: 'Stile',
  }
}

export function buildAmbienteTaxonomy(slug: string, label?: string): CatalogTaxonomyContext {
  const value = slug.trim().toLowerCase()
  return {
    kind: 'ambiente',
    value,
    label: label ?? value,
    world: 'design',
    hubPath: '/ambienti',
    hubLabel: 'Ambienti',
  }
}

/** Alias slug CMS/hub ↔ slug search Odoo (allineato a server odoo-catalog-slug). */
const BRAND_SLUG_ALIASES: Record<string, string> = {
  'tlb-italy': 'tlb',
  tlbitaly: 'tlb',
}

export function canonicalizeBrandSlug(slug: string): string {
  const normalized = slug.trim().toLowerCase()
  if (!normalized) return normalized
  return BRAND_SLUG_ALIASES[normalized] ?? normalized
}

export function buildBrandTaxonomy(slug: string, name: string): CatalogTaxonomyContext {
  return {
    kind: 'brand',
    value: canonicalizeBrandSlug(slug),
    label: name,
    hubPath: '/brand',
    hubLabel: 'Brand',
  }
}

export function buildCategoryTaxonomy(
  slug: string,
  options?: { label?: string; world?: 'design' | 'technical' },
): CatalogTaxonomyContext {
  const value = slug.trim().toLowerCase()
  return {
    kind: 'category',
    value,
    label: options?.label ?? value,
    world: options?.world ?? 'technical',
    hubPath: '/negozio',
    hubLabel: 'Categoria',
  }
}

export function humanizeSlug(slug: string): string {
  const s = slug.trim().replace(/[-_]+/g, ' ')
  if (!s) return slug
  return s.charAt(0).toUpperCase() + s.slice(1)
}
