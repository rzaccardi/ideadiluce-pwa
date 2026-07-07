import { ATTACCO_SEARCH, ATTACCO_SOCKETS } from '@/lib/attacco.defaults'
import { CATALOG_SEARCH_LIMITS, sanitizeCatalogSearchInput } from '@/lib/catalog-search-limits'
import { productSeoPath } from '@/lib/seo-paths'
import type { CategoryDTO, PriceDisplayModeDTO } from '@/types/dto'
import type { BrandListItemDTO } from '@/types/site-content'

export type CatalogSearchSuggestionKind =
  | 'attacco'
  | 'brand'
  | 'category'
  | 'product'
  | 'hint'
  | 'query'

export type CatalogSearchProductMeta = {
  imageUrl?: string | null
  priceCents?: number
  currency?: string
  priceDisplayMode?: PriceDisplayModeDTO
  specTags?: readonly string[]
}

export type CatalogSearchSuggestion = {
  id: string
  kind: CatalogSearchSuggestionKind
  label: string
  sublabel?: string
  /** Path senza prefisso locale, es. /negozio?attacco=E27 */
  path: string
  product?: CatalogSearchProductMeta
}

export type CatalogSearchSuggestionGroup = {
  kind: CatalogSearchSuggestionKind
  items: CatalogSearchSuggestion[]
}

const NATURAL_LANGUAGE_ATTACCO: ReadonlyArray<{ phrases: string[]; code: string; label: string }> = [
  { phrases: ['vite grande', 'attacco grande', 'grande a vite'], code: 'E27', label: 'E27 — attacco grande a vite' },
  { phrases: ['vite piccola', 'attacco piccolo', 'piccolo a vite'], code: 'E14', label: 'E14 — attacco piccolo a vite' },
  { phrases: ['faretto baionetta', 'baionetta', 'due pin larghi'], code: 'GU10', label: 'GU10 — faretto a baionetta' },
  { phrases: ['faretto due pin', 'mr16', '12v faretto'], code: 'GU5.3', label: 'GU5.3 — faretto 12V MR16' },
  { phrases: ['lampadina lunga', 'lineare', 'r7s'], code: 'R7s', label: 'R7s — lampadina lineare' },
  { phrases: ['neon led', 'tubo led', 't8', 'g13'], code: 'G13', label: 'G13 · T8 — tubo LED' },
  { phrases: ['capsula', 'g9'], code: 'G9', label: 'G9 — capsula a vite ad asola' },
  { phrases: ['disco piatto', 'gx53', 'sottopensile'], code: 'GX53', label: 'GX53 — attacco piatto a disco' },
]

function normalizeQuery(value: string): string {
  return value.trim().toLowerCase()
}

function matchesQuery(haystack: string, query: string): boolean {
  const q = normalizeQuery(query)
  if (!q) return false
  return haystack.toLowerCase().includes(q)
}

function attaccoCatalogPath(code: string): string {
  const normalized = code.replace(' · T8', '').trim()
  return `/negozio?world=technical&attacco=${encodeURIComponent(normalized)}`
}

function searchAttacchi(query: string, max: number): CatalogSearchSuggestion[] {
  const q = normalizeQuery(query)
  if (!q) return []

  const results: CatalogSearchSuggestion[] = []
  const seen = new Set<string>()

  function push(code: string, label: string, sublabel?: string) {
    const key = code.toUpperCase()
    if (seen.has(key)) return
    seen.add(key)
    results.push({
      id: `attacco:${key}`,
      kind: 'attacco',
      label,
      sublabel,
      path: attaccoCatalogPath(code),
    })
  }

  for (const mapping of NATURAL_LANGUAGE_ATTACCO) {
    if (mapping.phrases.some((phrase) => phrase.includes(q) || q.includes(phrase))) {
      push(mapping.code, mapping.label)
    }
  }

  for (const hint of ATTACCO_SEARCH.hints) {
    if (matchesQuery(hint.label, query) || matchesQuery(hint.query, query)) {
      push(hint.query, hint.label.replace(/^"|"$/g, ''))
    }
  }

  for (const socket of ATTACCO_SOCKETS) {
    if (socket.key === 'altri') continue
    const searchable = `${socket.code} ${socket.hint} ${socket.description}`
    if (matchesQuery(searchable, query) || matchesQuery(socket.code, query)) {
      push(socket.code, socket.code, socket.hint)
    }
  }

  return results.slice(0, max)
}

function searchBrands(
  query: string,
  brands: ReadonlyArray<BrandListItemDTO>,
  max: number,
): CatalogSearchSuggestion[] {
  const q = normalizeQuery(query)
  if (!q) return []

  return brands
    .filter((brand) => matchesQuery(brand.name, query) || matchesQuery(brand.slug, query))
    .slice(0, max)
    .map((brand) => ({
      id: `brand:${brand.slug}`,
      kind: 'brand' as const,
      label: brand.name,
      sublabel: brand.productCount ? `${brand.productCount} prodotti` : undefined,
      path: `/negozio?brand=${encodeURIComponent(brand.slug)}`,
    }))
}

function searchCategories(
  query: string,
  categories: ReadonlyArray<CategoryDTO>,
  max: number,
): CatalogSearchSuggestion[] {
  const q = normalizeQuery(query)
  if (!q) return []

  return categories
    .filter((category) => matchesQuery(category.name, query) || matchesQuery(category.slug, query))
    .slice(0, max)
    .map((category) => ({
      id: `category:${category.slug}`,
      kind: 'category' as const,
      label: category.name,
      path: `/negozio?category=${encodeURIComponent(category.slug)}`,
    }))
}

function searchHints(query: string, hints: ReadonlyArray<string>, max: number): CatalogSearchSuggestion[] {
  const q = normalizeQuery(query)
  if (!q) return []

  return hints
    .filter((hint) => matchesQuery(hint, query))
    .slice(0, max)
    .map((hint) => ({
      id: `hint:${hint}`,
      kind: 'hint' as const,
      label: hint,
      path: `/negozio?q=${encodeURIComponent(hint)}`,
    }))
}

export function searchLocalCatalogSuggestions(
  query: string,
  options: {
    brands?: ReadonlyArray<BrandListItemDTO>
    categories?: ReadonlyArray<CategoryDTO>
    hints?: ReadonlyArray<string>
    maxPerGroup?: number
  },
): CatalogSearchSuggestionGroup[] {
  const max = options.maxPerGroup ?? 4
  const q = normalizeQuery(sanitizeCatalogSearchInput(query))
  if (q.length < CATALOG_SEARCH_LIMITS.minLocalLength) return []

  const groups: CatalogSearchSuggestionGroup[] = []

  const attacchi = searchAttacchi(query, max)
  if (attacchi.length) groups.push({ kind: 'attacco', items: attacchi })

  const brands = searchBrands(query, options.brands ?? [], max)
  if (brands.length) groups.push({ kind: 'brand', items: brands })

  const categories = searchCategories(query, options.categories ?? [], max)
  if (categories.length) groups.push({ kind: 'category', items: categories })

  const hints = searchHints(query, options.hints ?? [], max)
  if (hints.length) groups.push({ kind: 'hint', items: hints })

  return groups
}

export function productToSearchSuggestion(product: {
  slug: string
  name: string
  shortDescription?: string | null
  imageUrl?: string | null
  priceCents?: number
  currency?: string
  priceDisplayMode?: PriceDisplayModeDTO
  specTags?: readonly string[]
}): CatalogSearchSuggestion {
  const specPreview = product.specTags?.slice(0, 2).join(' · ')
  const sublabel = product.shortDescription?.trim() || specPreview || undefined

  return {
    id: `product:${product.slug}`,
    kind: 'product',
    label: product.name,
    sublabel,
    path: productSeoPath(product.slug),
    product: {
      imageUrl: product.imageUrl,
      priceCents: product.priceCents,
      currency: product.currency,
      priceDisplayMode: product.priceDisplayMode,
      specTags: product.specTags,
    },
  }
}

export function buildCatalogSubmitPath(
  query: string,
  options?: { world?: 'technical' | 'design' | 'all' },
): string {
  const trimmed = sanitizeCatalogSearchInput(query)
  const params = new URLSearchParams()
  if (options?.world === 'technical') params.set('world', 'technical')
  if (options?.world === 'design') params.set('world', 'design')
  if (trimmed) params.set('q', trimmed)
  const qs = params.toString()
  return qs ? `/negozio?${qs}` : '/negozio'
}
