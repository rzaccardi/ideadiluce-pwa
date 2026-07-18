import type { CategoryDTO } from '@/types/dto'
import type { ProductCardDTO } from '@/types/dto'
import type { CatalogSort } from '@/features/catalog/catalog.store'
import type { ProductCatalogKind } from '@/lib/product-catalog-kind'
import { resolveProductCardCatalogKind } from '@/lib/product-catalog-kind'
import { buildTechnicalCardSpecTags } from '@/lib/technical-card-spec-tags'

export const CATALOG_DESIGN_CATEGORY_SLUG = 'arredo'
export const CATALOG_TECHNICAL_CATEGORY_SLUG = 'illuminazione-tecnica'

export type CatalogWorldTab = 'all' | 'design' | 'technical'

export const CATALOG_WORLD_TAB_HREFS: Record<CatalogWorldTab, string> = {
  all: '/negozio',
  design: '/categoria-prodotto/illuminazione-arredo',
  technical: '/categoria-prodotto/illuminazione-tecnica',
}

export type CatalogPriceBucket = '0-50' | '50-200' | '200-700' | '700+'

export const CATALOG_PRICE_BUCKETS: ReadonlyArray<{
  id: CatalogPriceBucket
  label: string
  minEuro?: number
  maxEuro?: number
}> = [
  { id: '0-50', label: '€ 0 – 50', minEuro: 0, maxEuro: 50 },
  { id: '50-200', label: '€ 50 – 200', minEuro: 50, maxEuro: 200 },
  { id: '200-700', label: '€ 200 – 700', minEuro: 200, maxEuro: 700 },
  { id: '700+', label: '€ 700 +', minEuro: 700 },
]

export const CATALOG_COLOR_TEMPS = ['2700K', '3000K', '4000K', '6500K'] as const

export const CATALOG_SOCKET_FILTERS = [
  'GU10',
  'E27',
  'E14',
  'GU5.3',
  'R7s',
  'G9',
  'T8',
] as const

export type CatalogActiveFilter = {
  key: string
  label: string
}

export function parseCatalogWorld(value: string | null | undefined): CatalogWorldTab {
  if (value === 'design') return 'design'
  if (value === 'technical') return 'technical'
  return 'all'
}

export function worldTabToParam(tab: CatalogWorldTab): 'design' | 'technical' | null {
  if (tab === 'design') return 'design'
  if (tab === 'technical') return 'technical'
  return null
}

/** Query testuale inviata all'API catalogo (solo testo libero, non filtri strutturati). */
export function buildCatalogApiQuery(q?: string): string | undefined {
  const trimmed = q?.trim()
  return trimmed || undefined
}

/** @deprecated Usare buildCatalogApiQuery + filterProductsBySpec per attacco/Kelvin. */
export function buildCatalogSearchQuery(parts: {
  q?: string
  attacco?: string
  colorTemp?: string
}): string | undefined {
  return buildCatalogApiQuery(parts.q)
}

export type CatalogSpecFilters = {
  attacco?: string
  colorTemp?: string
}

export type CatalogPreserveParams = CatalogSpecFilters & {
  world?: 'technical' | 'design'
  brand?: string
  category?: string
}

function normalizeSocketFilter(value: string): string {
  return value.replace(/GU5[.-]3/i, 'GU5.3').replace(/^r7s$/i, 'R7s').toUpperCase()
}

function normalizeKelvinFilter(value: string): string {
  return value.replace(/\s/g, '').toUpperCase()
}

export function productMatchesSpecFilter(
  product: ProductCardDTO,
  filters: CatalogSpecFilters,
): boolean {
  if (!filters.attacco?.trim() && !filters.colorTemp?.trim()) return true

  const tags = buildTechnicalCardSpecTags({
    name: product.name,
    shortDescription: product.shortDescription,
    specTags: product.specTags,
  })
  const haystack = [...tags, product.name, product.shortDescription ?? '']
    .join(' ')
    .replace(/GU5[.-]3/gi, 'GU5.3')

  if (filters.attacco?.trim()) {
    const needle = normalizeSocketFilter(filters.attacco)
    if (!haystack.toUpperCase().includes(needle)) return false
  }

  if (filters.colorTemp?.trim()) {
    const needle = normalizeKelvinFilter(filters.colorTemp)
    if (!haystack.toUpperCase().includes(needle)) return false
  }

  return true
}

export function filterProductsBySpec(
  products: ReadonlyArray<ProductCardDTO>,
  filters: CatalogSpecFilters,
): ProductCardDTO[] {
  if (!filters.attacco?.trim() && !filters.colorTemp?.trim()) return [...products]
  return products.filter((product) => productMatchesSpecFilter(product, filters))
}

export function resolveEffectiveCatalogCategory(input: {
  categoryParam?: string
  worldTab: CatalogWorldTab
  attacco?: string
  colorTemp?: string
}): string | undefined {
  if (input.categoryParam) return input.categoryParam
  if (input.worldTab === 'design') return CATALOG_DESIGN_CATEGORY_SLUG
  if (input.worldTab === 'technical') return CATALOG_TECHNICAL_CATEGORY_SLUG
  if (input.attacco?.trim() || input.colorTemp?.trim()) return CATALOG_TECHNICAL_CATEGORY_SLUG
  return undefined
}

export function parseCatalogPreserveParams(params: URLSearchParams): CatalogPreserveParams {
  const preserve: CatalogPreserveParams = {}
  const world = params.get('world')
  if (world === 'technical' || world === 'design') preserve.world = world

  const attacco = params.get('attacco')?.trim()
  if (attacco) preserve.attacco = attacco

  const colorTemp = params.get('colorTemp')?.trim()
  if (colorTemp) preserve.colorTemp = colorTemp

  const brand = params.get('brand')?.trim()
  if (brand) preserve.brand = brand

  const category = params.get('category')?.trim()
  if (category) preserve.category = category

  return preserve
}

export function priceBucketToCents(bucket: CatalogPriceBucket | null | undefined): {
  minPriceCents?: number
  maxPriceCents?: number
} {
  if (!bucket) return {}
  const match = CATALOG_PRICE_BUCKETS.find((b) => b.id === bucket)
  if (!match) return {}
  return {
    minPriceCents: match.minEuro != null ? match.minEuro * 100 : undefined,
    maxPriceCents: match.maxEuro != null ? match.maxEuro * 100 : undefined,
  }
}

export function centsToPriceBucket(
  minPriceCents?: number,
  maxPriceCents?: number,
): CatalogPriceBucket | undefined {
  for (const bucket of CATALOG_PRICE_BUCKETS) {
    const min = bucket.minEuro != null ? bucket.minEuro * 100 : undefined
    const max = bucket.maxEuro != null ? bucket.maxEuro * 100 : undefined
    if (minPriceCents === min && maxPriceCents === max) return bucket.id
  }
  return undefined
}

export function partitionCategories(categories: ReadonlyArray<CategoryDTO>) {
  const roots = categories.filter((c) => !c.parentId)
  const childrenByParent = new Map<string, CategoryDTO[]>()

  for (const category of categories) {
    if (!category.parentId) continue
    const list = childrenByParent.get(category.parentId) ?? []
    list.push(category)
    childrenByParent.set(category.parentId, list)
  }

  for (const list of childrenByParent.values()) {
    list.sort((a, b) => a.name.localeCompare(b.name, 'it'))
  }

  const sortedRoots = [...roots].sort((a, b) => a.name.localeCompare(b.name, 'it'))
  return { roots: sortedRoots, childrenByParent }
}

export function resolveCategoryGroups(
  categories: ReadonlyArray<CategoryDTO>,
  selectedSlug?: string,
) {
  const { roots, childrenByParent } = partitionCategories(categories)
  const selected = selectedSlug ? categories.find((c) => c.slug === selectedSlug) : undefined

  let rootCategories = roots
  let subcategories: CategoryDTO[] = []

  if (selected) {
    if (selected.parentId) {
      const parent = categories.find((c) => c.id === selected.parentId)
      if (parent) {
        rootCategories = [parent]
        subcategories = childrenByParent.get(parent.id) ?? []
      }
    } else {
      rootCategories = [selected]
      subcategories = childrenByParent.get(selected.id) ?? []
    }
  } else if (roots.length === 1) {
    subcategories = childrenByParent.get(roots[0]!.id) ?? []
  }

  return { rootCategories, subcategories, selected }
}

export function filterProductsByWorld(
  products: ReadonlyArray<ProductCardDTO>,
  world: CatalogWorldTab,
): ProductCardDTO[] {
  if (world === 'all') return [...products]
  return products.filter((product) => resolveProductCardCatalogKind(product) === world)
}

export function sortLabelForParam(sort: CatalogSort): string {
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

export function buildActiveFilters(input: {
  categories: ReadonlyArray<CategoryDTO>
  brands: ReadonlyArray<{ slug: string; name: string }>
  categorySlug?: string
  brandSlug?: string
  attacco?: string
  colorTemp?: string
  priceBucket?: CatalogPriceBucket
  inStockOnly?: boolean
  q?: string
  world?: CatalogWorldTab
}): CatalogActiveFilter[] {
  const filters: CatalogActiveFilter[] = []

  if (input.world && input.world !== 'all') {
    filters.push({
      key: 'world',
      label: input.world === 'design' ? 'Arredo' : 'Tecnica',
    })
  }

  if (input.categorySlug) {
    const category = input.categories.find((c) => c.slug === input.categorySlug)
    filters.push({ key: 'category', label: category?.name ?? input.categorySlug })
  }

  if (input.brandSlug) {
    const brand = input.brands.find((b) => b.slug === input.brandSlug)
    filters.push({ key: 'brand', label: `Brand: ${brand?.name ?? input.brandSlug}` })
  }

  if (input.attacco) {
    filters.push({ key: 'attacco', label: input.attacco })
  }

  if (input.colorTemp) {
    filters.push({ key: 'colorTemp', label: input.colorTemp })
  }

  if (input.priceBucket) {
    const bucket = CATALOG_PRICE_BUCKETS.find((b) => b.id === input.priceBucket)
    if (bucket) filters.push({ key: 'priceBucket', label: bucket.label })
  }

  if (input.inStockOnly) {
    filters.push({ key: 'inStock', label: 'Pronta consegna' })
  }

  if (input.q?.trim()) {
    filters.push({ key: 'q', label: `"${input.q.trim()}"` })
  }

  return filters
}

export function categoryNameBySlug(
  categories: ReadonlyArray<CategoryDTO>,
  slug: string | null | undefined,
): string | null {
  if (!slug) return null
  return categories.find((c) => c.slug === slug)?.name ?? null
}

export function designCardBrandLabel(
  product: ProductCardDTO,
  categories: ReadonlyArray<CategoryDTO>,
): string {
  return categoryNameBySlug(categories, product.categorySlug)?.toUpperCase() ?? '—'
}

export type { ProductCatalogKind }
