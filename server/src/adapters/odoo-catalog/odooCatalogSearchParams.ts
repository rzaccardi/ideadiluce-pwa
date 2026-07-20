/**
 * Parametri query per GET /api/v2/products/search e GET /api/v2/filters.
 * Alias slug storefront legacy → category Odoo v2 (tecnico/arredo).
 * Paradigma PWA: niente `world` in uscita — solo `category`.
 */
import type { OdooCatalogProductSearchSort } from './odooCatalog.types.js'

export type OdooCatalogWorld = 'design' | 'technical'

/** Slug categoria PWA/CMS → root Odoo v2. */
const CATEGORY_SLUG_ALIASES: Record<string, string> = {
  'illuminazione-tecnica': 'tecnico',
  'prodotti-tecnici': 'tecnico',
  tecnico: 'tecnico',
  arredo: 'arredo',
  'illuminazione-arredo': 'arredo',
  'illuminazione-design': 'arredo',
}

export type OdooCatalogFilterParams = {
  q?: string
  /** Accettato in ingresso (compat); convertito in category, non inoltrato. */
  world?: OdooCatalogWorld | string
  category?: string
  subcategory?: string
  tipologia?: string
  ambiente?: string
  stile?: string
  brand?: string
  attacco?: string
  wattaggio?: string | number
  wattaggio_min?: string | number
  wattaggio_max?: string | number
  color_temp?: string
  tag?: string
}

export type OdooCatalogSearchParams = OdooCatalogFilterParams & {
  page?: number
  per_page?: number
  sort?: OdooCatalogProductSearchSort | string
}

function setIfPresent(out: Record<string, string>, key: string, value: unknown) {
  if (value == null) return
  const s = String(value).trim()
  if (!s) return
  out[key] = s
}

/** Normalizza category/world PWA verso i parametri ammessi da Odoo v2 (senza world). */
export function normalizeOdooCatalogFilters(
  input: OdooCatalogFilterParams,
): OdooCatalogFilterParams {
  const rawCategory = input.category?.trim() || undefined
  const alias = rawCategory ? CATEGORY_SLUG_ALIASES[rawCategory.toLowerCase()] : undefined

  let category = alias ?? rawCategory
  const world = input.world?.trim() || undefined

  if (!category && (world === 'design' || world === 'technical')) {
    category = world === 'design' ? 'arredo' : 'tecnico'
  }

  return {
    ...input,
    world: undefined,
    category,
  }
}

/** Costruisce query string params (senza website/lang) per search o filters. */
export function toOdooCatalogQueryParams(
  input: OdooCatalogSearchParams,
  options?: { includePagination?: boolean },
): Record<string, string> {
  const normalized = normalizeOdooCatalogFilters(input)
  const out: Record<string, string> = {}

  setIfPresent(out, 'q', normalized.q)
  setIfPresent(out, 'category', normalized.category)
  setIfPresent(out, 'subcategory', normalized.subcategory)
  setIfPresent(out, 'tipologia', normalized.tipologia)
  setIfPresent(out, 'ambiente', normalized.ambiente)
  setIfPresent(out, 'stile', normalized.stile)
  setIfPresent(out, 'brand', normalized.brand)
  setIfPresent(out, 'attacco', normalized.attacco)
  setIfPresent(out, 'wattaggio', normalized.wattaggio)
  setIfPresent(out, 'wattaggio_min', normalized.wattaggio_min)
  setIfPresent(out, 'wattaggio_max', normalized.wattaggio_max)
  setIfPresent(out, 'color_temp', normalized.color_temp)
  setIfPresent(out, 'tag', normalized.tag)

  if (options?.includePagination !== false) {
    if (input.page != null) setIfPresent(out, 'page', Math.max(1, Number(input.page) || 1))
    if (input.per_page != null) {
      setIfPresent(out, 'per_page', Math.min(100, Math.max(1, Number(input.per_page) || 24)))
    }
    setIfPresent(out, 'sort', input.sort)
  }

  return out
}
