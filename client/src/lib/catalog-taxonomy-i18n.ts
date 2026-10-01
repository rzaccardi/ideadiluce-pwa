/**
 * Traduzione UI per tassonomia catalogo nota (slug Odoo / label IT).
 * I facet raw non mappati restano invariati (limite documentato).
 */
import type { MessageKey } from '@/i18n/messages/keys'
import type { CatalogTaxonomyContext, CatalogTaxonomyKind } from '@/lib/catalog-taxonomy'
import { humanizeSlug } from '@/lib/catalog-taxonomy'

type TranslateFn = (key: MessageKey) => string
type TranslateParamsFn = (key: MessageKey, params: Record<string, string | number>) => string

/** Slug canonici → chiavi i18n. */
const TAXONOMY_SLUG_KEYS: Record<string, MessageKey> = {
  // Tipologiche arredo
  sospensione: 'catalog.tax.sospensione',
  parete: 'catalog.tax.parete',
  applique: 'catalog.tax.parete',
  tavolo: 'catalog.tax.tavolo',
  terra: 'catalog.tax.terra',
  piantana: 'catalog.tax.terra',
  plafoniere: 'catalog.tax.plafoniere',
  plafoniera: 'catalog.tax.plafoniere',
  soffitto: 'catalog.tax.soffitto',
  incasso: 'catalog.tax.incasso',
  faretti: 'catalog.tax.faretti',
  'faretti-e-incassi': 'catalog.tax.faretti',

  // Ambienti
  soggiorno: 'catalog.tax.soggiorno',
  cucina: 'catalog.tax.cucina',
  camera: 'catalog.tax.camera',
  'camera-da-letto': 'catalog.tax.camera',
  bagno: 'catalog.tax.bagno',
  studio: 'catalog.tax.studio',
  esterno: 'catalog.tax.esterno',

  // Stili
  moderno: 'catalog.tax.moderno',
  classico: 'catalog.tax.classico',
  minimal: 'catalog.tax.minimal',
  decorativo: 'catalog.tax.decorativo',
  industrial: 'catalog.tax.industrial',
  outdoor: 'catalog.tax.outdoor',
  design: 'catalog.tax.design',

  // Categorie tecniche / mondi
  arredo: 'catalog.tax.arredo',
  'illuminazione-arredo': 'catalog.tax.illuminazioneArredo',
  'illuminazione-design': 'catalog.tax.illuminazioneArredo',
  tecnico: 'catalog.tax.tecnico',
  tecnica: 'catalog.tax.tecnica',
  'illuminazione-tecnica': 'catalog.tax.illuminazioneTecnica',
  'prodotti-tecnici': 'catalog.tax.prodottiTecnici',
  led: 'catalog.tax.led',
  alogene: 'catalog.tax.alogene',
  alogena: 'catalog.tax.alogene',
  fluorescente: 'catalog.tax.fluorescente',
  fluorescenza: 'catalog.tax.fluorescente',
  incandescenza: 'catalog.tax.incandescenza',
  scarica: 'catalog.tax.scarica',
  'lampade-scarica': 'catalog.tax.scarica',
  'lampada-scarica': 'catalog.tax.scarica',
  driver: 'catalog.tax.driver',
  ballast: 'catalog.tax.ballast',
  accessori: 'catalog.tax.accessori',
  portalampade: 'catalog.tax.portalampade',
  accenditori: 'catalog.tax.accenditori',
  strip: 'catalog.tax.strip',
  'strisce-led': 'catalog.tax.strip',

  // Finiture (filtri landing)
  nero: 'catalog.tax.nero',
  bianco: 'catalog.tax.bianco',
  oro: 'catalog.tax.oro',
  ottone: 'catalog.tax.ottone',
  cromo: 'catalog.tax.cromo',
  vetro: 'catalog.tax.vetro',

  // Chip / nav
  tutti: 'catalog.worldAll',
  'per-attacco': 'catalog.tax.perAttacco',
}

/** Label IT (e varianti) → stessa chiave, quando manca lo slug. */
const TAXONOMY_LABEL_KEYS: Record<string, MessageKey> = {
  sospensione: 'catalog.tax.sospensione',
  sospensioni: 'catalog.tax.sospensione',
  parete: 'catalog.tax.parete',
  applique: 'catalog.tax.parete',
  tavolo: 'catalog.tax.tavolo',
  terra: 'catalog.tax.terra',
  piantana: 'catalog.tax.terra',
  piantane: 'catalog.tax.terra',
  plafoniere: 'catalog.tax.plafoniere',
  plafoniera: 'catalog.tax.plafoniere',
  soffitto: 'catalog.tax.soffitto',
  incasso: 'catalog.tax.incasso',
  'faretti e incassi': 'catalog.tax.faretti',
  faretti: 'catalog.tax.faretti',
  soggiorno: 'catalog.tax.soggiorno',
  cucina: 'catalog.tax.cucina',
  camera: 'catalog.tax.camera',
  'camera da letto': 'catalog.tax.camera',
  bagno: 'catalog.tax.bagno',
  studio: 'catalog.tax.studio',
  esterno: 'catalog.tax.esterno',
  moderno: 'catalog.tax.moderno',
  classico: 'catalog.tax.classico',
  minimal: 'catalog.tax.minimal',
  decorativo: 'catalog.tax.decorativo',
  industrial: 'catalog.tax.industrial',
  outdoor: 'catalog.tax.outdoor',
  design: 'catalog.tax.design',
  arredo: 'catalog.tax.arredo',
  "illuminazione d'arredo": 'catalog.tax.illuminazioneArredo',
  tecnico: 'catalog.tax.tecnico',
  tecnica: 'catalog.tax.tecnica',
  tecnici: 'catalog.tax.tecnica',
  'illuminazione tecnica': 'catalog.tax.illuminazioneTecnica',
  'prodotti tecnici': 'catalog.tax.prodottiTecnici',
  led: 'catalog.tax.led',
  alogene: 'catalog.tax.alogene',
  alogena: 'catalog.tax.alogene',
  fluorescente: 'catalog.tax.fluorescente',
  fluorescenza: 'catalog.tax.fluorescente',
  incandescenza: 'catalog.tax.incandescenza',
  scarica: 'catalog.tax.scarica',
  driver: 'catalog.tax.driver',
  ballast: 'catalog.tax.ballast',
  accessori: 'catalog.tax.accessori',
  portalampade: 'catalog.tax.portalampade',
  accenditori: 'catalog.tax.accenditori',
  strip: 'catalog.tax.strip',
  'strisce led': 'catalog.tax.strip',
  nero: 'catalog.tax.nero',
  bianco: 'catalog.tax.bianco',
  oro: 'catalog.tax.oro',
  ottone: 'catalog.tax.ottone',
  cromo: 'catalog.tax.cromo',
  vetro: 'catalog.tax.vetro',
  tutti: 'catalog.worldAll',
  'per attacco': 'catalog.tax.perAttacco',
}

const FILTER_VALUE_PREFIXES = [
  'tipologia-',
  'ambiente-',
  'stile-',
  'category-',
  'finitura-',
  'tag-',
  'brand-',
  'attacco-',
  'kelvin-',
  'wattaggio-',
  'price-',
  'stock-',
] as const

function normalizeToken(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[_]+/g, '-')
    .replace(/\s+/g, ' ')
}

function slugifyToken(raw: string): string {
  return normalizeToken(raw).replace(/\s+/g, '-')
}

function taxonomyKeyForToken(token: string): MessageKey | undefined {
  const slug = slugifyToken(token)
  if (!slug) return undefined
  if (TAXONOMY_SLUG_KEYS[slug]) return TAXONOMY_SLUG_KEYS[slug]
  const label = normalizeToken(token)
  return TAXONOMY_LABEL_KEYS[label]
}

/** Estrae slug utile da value landing (`tipologia-tavolo`) o query token. */
export function extractTaxonomyTokenFromFilterValue(
  value?: string,
  queryToken?: string,
): string | undefined {
  const fromQuery = queryToken?.trim()
  if (fromQuery) {
    // queryToken può essere "parete applique" — prova prima parola nota
    const parts = fromQuery.toLowerCase().split(/\s+/)
    for (const part of parts) {
      if (taxonomyKeyForToken(part)) return part
    }
    return fromQuery
  }
  const raw = value?.trim()
  if (!raw) return undefined
  const lower = raw.toLowerCase()
  for (const prefix of FILTER_VALUE_PREFIXES) {
    if (lower.startsWith(prefix)) return raw.slice(prefix.length)
  }
  return raw
}

/**
 * Traduce una label tassonomia nota (slug o testo IT).
 * Se non mappata, restituisce `fallback` o lo slug humanizzato.
 */
export function translateCatalogTaxonomyLabel(
  slugOrLabel: string | null | undefined,
  t: TranslateFn,
  fallback?: string,
): string {
  const raw = slugOrLabel?.trim()
  if (!raw) return fallback ?? ''
  const key = taxonomyKeyForToken(raw)
  if (key) return t(key)
  if (fallback?.trim()) return fallback
  return humanizeSlug(raw)
}

export function translateCatalogFilterOptionLabel(
  option: { label: string; value?: string; queryToken?: string },
  t: TranslateFn,
): string {
  const token = extractTaxonomyTokenFromFilterValue(option.value, option.queryToken)
  if (token) {
    const key = taxonomyKeyForToken(token)
    if (key) return t(key)
  }
  const byLabel = taxonomyKeyForToken(option.label)
  if (byLabel) return t(byLabel)
  return option.label
}

const HUB_KIND_KEYS: Record<CatalogTaxonomyKind, MessageKey> = {
  attacco: 'catalog.attacco',
  tipologia: 'catalog.tipologia',
  stile: 'catalog.stile',
  ambiente: 'catalog.ambienti',
  brand: 'catalog.brand',
  category: 'catalog.categoryLabel',
  tag: 'catalog.tag',
}

export function translateTaxonomyHubLabel(kind: CatalogTaxonomyKind, t: TranslateFn): string {
  return t(HUB_KIND_KEYS[kind])
}

export function translateTaxonomyPageTitle(
  ctx: CatalogTaxonomyContext,
  t: TranslateFn,
  tParams: TranslateParamsFn,
): string {
  const label = translateCatalogTaxonomyLabel(ctx.value, t, ctx.label)
  switch (ctx.kind) {
    case 'attacco':
      return tParams('catalog.taxonomyTitle.attacco', { label: ctx.label || label })
    case 'stile':
      return tParams('catalog.taxonomyTitle.stile', { label })
    case 'tipologia':
    case 'ambiente':
    case 'brand':
    case 'category':
    case 'tag':
    default:
      return label.charAt(0).toUpperCase() + label.slice(1)
  }
}

export function translateTaxonomyPageSubtitle(
  ctx: CatalogTaxonomyContext,
  tParams: TranslateParamsFn,
  t: TranslateFn,
): string {
  return tParams('catalog.taxonomyFilteredBy', {
    kind: translateTaxonomyHubLabel(ctx.kind, t).toLowerCase(),
  })
}
