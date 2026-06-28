import type { CatalogSort } from '@/features/catalog/catalog.store'
import type { CategoryFilterGroup, CategoryLandingKey } from '@/types/category-landing'
import type { BrandListItemDTO } from '@/types/site-content'
import { centsToPriceBucket, priceBucketToCents, type CatalogPriceBucket } from '@/lib/catalog-filters'

export type CategoryLandingCatalogConfig = {
  categorySlug: string
  baseQuery?: string
}

export const CATEGORY_LANDING_CATALOG_CONFIG: Record<CategoryLandingKey, CategoryLandingCatalogConfig> = {
  design: { categorySlug: 'illuminazione-arredo' },
  technical: { categorySlug: 'illuminazione-tecnica', baseQuery: 'lampadina driver alimentatore' },
  'technical-products': { categorySlug: 'illuminazione-tecnica', baseQuery: 'alimentatore driver trasformatore' },
}

const FILTER_PARAM = 'f'

const DESIGN_PRICE_RANGES: ReadonlyArray<{
  value: string
  minEuro?: number
  maxEuro?: number
}> = [
  { value: 'price-0-100', minEuro: 0, maxEuro: 100 },
  { value: 'price-100-300', minEuro: 100, maxEuro: 300 },
  { value: 'price-300-700', minEuro: 300, maxEuro: 700 },
  { value: 'price-700-plus', minEuro: 700 },
]

function allFilterOptions(groups: ReadonlyArray<CategoryFilterGroup>) {
  return groups.flatMap((group) =>
    group.options.map((option) => ({
      group,
      option,
      value: option.value,
    })),
  )
}

export function parseCategoryLandingFilters(params: URLSearchParams): Set<string> {
  const raw = params.get(FILTER_PARAM)
  if (!raw?.trim()) return new Set()
  return new Set(
    raw
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean),
  )
}

export function serializeCategoryLandingFilters(values: ReadonlySet<string>): string | null {
  if (!values.size) return null
  return [...values].sort().join(',')
}

export function toggleCategoryLandingFilter(
  current: ReadonlySet<string>,
  value: string,
): Set<string> {
  const next = new Set(current)

  if (next.has(value)) {
    next.delete(value)
    return next
  }

  if (value.startsWith('price-')) {
    for (const existing of next) {
      if (existing.startsWith('price-')) next.delete(existing)
    }
  }
  if (value.startsWith('brand-')) {
    for (const existing of next) {
      if (existing.startsWith('brand-')) next.delete(existing)
    }
  }
  if (value.startsWith('stock-')) {
    for (const existing of next) {
      if (existing.startsWith('stock-')) next.delete(existing)
    }
  }

  next.add(value)
  return next
}

function designPriceCents(selected: ReadonlySet<string>): {
  minPriceCents?: number
  maxPriceCents?: number
} {
  for (const range of DESIGN_PRICE_RANGES) {
    if (selected.has(range.value)) {
      return {
        minPriceCents: range.minEuro != null ? range.minEuro * 100 : undefined,
        maxPriceCents: range.maxEuro != null ? range.maxEuro * 100 : undefined,
      }
    }
  }
  return {}
}

function catalogPriceCents(selected: ReadonlySet<string>): {
  minPriceCents?: number
  maxPriceCents?: number
} {
  for (const bucket of ['0-50', '50-200', '200-700', '700+'] as CatalogPriceBucket[]) {
    const value = `price-${bucket}`
    if (selected.has(value)) return priceBucketToCents(bucket)
  }
  return {}
}

export function resolveCategoryLandingPriceCents(
  pageKey: CategoryLandingKey,
  selected: ReadonlySet<string>,
  priceBucketParam?: CatalogPriceBucket,
  minPriceFromUrl?: number,
  maxPriceFromUrl?: number,
): { minPriceCents?: number; maxPriceCents?: number } {
  const fromUrl =
    priceBucketParam != null
      ? priceBucketToCents(priceBucketParam)
      : minPriceFromUrl != null || maxPriceFromUrl != null
        ? { minPriceCents: minPriceFromUrl, maxPriceCents: maxPriceFromUrl }
        : {}

  if (fromUrl.minPriceCents != null || fromUrl.maxPriceCents != null) return fromUrl

  if (pageKey === 'design') return designPriceCents(selected)
  return catalogPriceCents(selected)
}

export function resolveCategoryLandingInStock(
  selected: ReadonlySet<string>,
  inStockFromUrl: boolean,
): boolean {
  if (inStockFromUrl) return true
  return selected.has('stock-in')
}

export function resolveCategoryLandingBrandSlug(
  selected: ReadonlySet<string>,
  brands: ReadonlyArray<BrandListItemDTO>,
  brandFromUrl?: string,
): string | undefined {
  if (brandFromUrl) return brandFromUrl

  const brandValues = [...selected].filter((value) => value.startsWith('brand-'))
  if (brandValues.length !== 1) return undefined

  const token = brandValues[0]!.slice('brand-'.length)
  const exact = brands.find((brand) => brand.slug === token)
  if (exact) return exact.slug

  const fuzzy = brands.find(
    (brand) =>
      brand.slug.includes(token) ||
      brand.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === token,
  )
  return fuzzy?.slug
}

export function buildCategoryLandingSearchQuery(input: {
  pageKey: CategoryLandingKey
  baseQuery?: string
  selected: ReadonlySet<string>
  groups: ReadonlyArray<CategoryFilterGroup>
  extraQuery?: string
  brandSlug?: string
}): string | undefined {
  const tokens: string[] = []
  const base = input.baseQuery?.trim() || CATEGORY_LANDING_CATALOG_CONFIG[input.pageKey].baseQuery?.trim()
  if (base) tokens.push(base)
  if (input.extraQuery?.trim()) tokens.push(input.extraQuery.trim())

  for (const { option, value } of allFilterOptions(input.groups)) {
    if (!input.selected.has(value)) continue
    if (value.startsWith('price-') || value.startsWith('stock-')) continue
    if (value.startsWith('brand-')) {
      if (!input.brandSlug) tokens.push(option.queryToken ?? option.label)
      continue
    }
    tokens.push(option.queryToken ?? option.label)
  }

  const unique = [...new Set(tokens.map((token) => token.trim()).filter(Boolean))]
  return unique.length ? unique.join(' ') : undefined
}

export function buildCategoryLandingActiveFilters(input: {
  groups: ReadonlyArray<CategoryFilterGroup>
  selected: ReadonlySet<string>
}): Array<{ key: string; label: string }> {
  const filters: Array<{ key: string; label: string }> = []

  for (const { option, value } of allFilterOptions(input.groups)) {
    if (!input.selected.has(value)) continue
    filters.push({ key: value, label: option.label })
  }

  return filters
}

export function categoryLandingSortLabel(sort: CatalogSort): string {
  switch (sort) {
    case 'price_asc':
      return 'Prezzo crescente'
    case 'price_desc':
      return 'Prezzo decrescente'
    case 'name_asc':
      return 'Nome A–Z'
    default:
      return 'Rilevanza'
  }
}

export function patchCategoryLandingFilterParams(
  params: URLSearchParams,
  selected: ReadonlySet<string>,
): URLSearchParams {
  const next = new URLSearchParams(params)
  next.delete('page')
  next.delete('pagination')
  const serialized = serializeCategoryLandingFilters(selected)
  if (serialized) next.set(FILTER_PARAM, serialized)
  else next.delete(FILTER_PARAM)
  return next
}

export function resetCategoryLandingFilterParams(params: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(params)
  next.delete(FILTER_PARAM)
  next.delete('brand')
  next.delete('inStock')
  next.delete('priceBucket')
  next.delete('minPrice')
  next.delete('maxPrice')
  next.delete('sort')
  next.delete('page')
  next.delete('pagination')
  return next
}

export function removeCategoryLandingFilter(
  current: ReadonlySet<string>,
  key: string,
): Set<string> {
  const next = new Set(current)
  next.delete(key)
  return next
}

export function selectedPriceBucketFromFilters(
  selected: ReadonlySet<string>,
): CatalogPriceBucket | undefined {
  for (const bucket of ['0-50', '50-200', '200-700', '700+'] as CatalogPriceBucket[]) {
    if (selected.has(`price-${bucket}`)) return bucket
  }
  return undefined
}

export function centsToDesignPriceValue(
  minPriceCents?: number,
  maxPriceCents?: number,
): string | undefined {
  for (const range of DESIGN_PRICE_RANGES) {
    const min = range.minEuro != null ? range.minEuro * 100 : undefined
    const max = range.maxEuro != null ? range.maxEuro * 100 : undefined
    if (minPriceCents === min && maxPriceCents === max) return range.value
  }
  return undefined
}

export { centsToPriceBucket, FILTER_PARAM as CATEGORY_LANDING_FILTER_PARAM }
