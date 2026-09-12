import type { ProductCardDTO, ProductDetailDTO } from '@/types/dto'
import {
  buildDesignerProjectsHref,
  CATALOG_DESIGN_CATEGORY_SLUG,
  catalogWorldOfCategorySlug,
  isUsableDesignerName,
} from '@/lib/catalog-filters'
import { findSpecValue, type ProductSpecRow } from '@/lib/product-specs-parse'

export const DESIGN_RELATED_LIMIT = 8

export type DesignRelatedKind = 'designer' | 'similar'

export type DesignRelatedCatalogParams = {
  q?: string
  world: 'design'
  category?: string
  brand?: string
  tipologia?: string
  ambiente?: string
  stile?: string
}

export type DesignRelatedSearch = {
  kind: DesignRelatedKind
  params: DesignRelatedCatalogParams
  href: string | null
}

export type DesignRelatedFilters = {
  designerName: string | null
  tipologia?: string
  stile?: string
  ambiente?: string
  brand?: string
}

const TIPOLOGIA_ALIASES: ReadonlyArray<readonly [RegExp, string]> = [
  [/sospension|pendant/i, 'sospensione'],
  [/applique|parete|wall/i, 'applique'],
  [/piantana|terra|floor/i, 'piantana'],
  [/tavolo|table/i, 'tavolo'],
  [/plafonier|soffitto|ceiling/i, 'plafoniera'],
  [/faretto|spot/i, 'faretti'],
  [/outdoor|esterno/i, 'outdoor'],
]

export function catalogFilterSlugFromLabel(value: string | null | undefined): string | undefined {
  const slug = (value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || undefined
}

function isDesignRootSlug(slug: string): boolean {
  return catalogWorldOfCategorySlug(slug) === 'design' && /^(arredo|illuminazione-arredo|illuminazione-design)$/i.test(slug)
}

function inferTipologiaSlug(
  product: Pick<ProductDetailDTO, 'categories' | 'categorySlug'>,
  specRows: ReadonlyArray<ProductSpecRow>,
): string | undefined {
  const categorySlugs = [
    ...(product.categories ?? []).map((c) => c.slug?.trim().toLowerCase() ?? ''),
    product.categorySlug?.trim().toLowerCase() ?? '',
  ].filter(Boolean)

  const fromCategory = categorySlugs.find((slug) => !isDesignRootSlug(slug) && catalogWorldOfCategorySlug(slug) !== 'technical')
  if (fromCategory && !isDesignRootSlug(fromCategory)) return fromCategory

  const spec = findSpecValue(specRows, /tipologia.*lamp|lamp.?type|tipo.?lamp|^tipologia$/)
  if (!spec) return undefined
  for (const [pattern, slug] of TIPOLOGIA_ALIASES) {
    if (pattern.test(spec)) return slug
  }
  return catalogFilterSlugFromLabel(spec)
}

export function extractDesignRelatedFilters(
  product: Pick<ProductDetailDTO, 'categories' | 'categorySlug' | 'brand'>,
  specRows: ReadonlyArray<ProductSpecRow>,
): DesignRelatedFilters {
  const designerRaw =
    findSpecValue(specRows, /designer/i) ?? specRows.find((row) => /designer/i.test(row.label))?.value ?? null
  const designerName = isUsableDesignerName(designerRaw) ? designerRaw!.trim() : null

  return {
    designerName,
    tipologia: inferTipologiaSlug(product, specRows),
    stile: catalogFilterSlugFromLabel(findSpecValue(specRows, /^stile$|^style$/)),
    ambiente: catalogFilterSlugFromLabel(findSpecValue(specRows, /^ambiente$|^room$/)),
    brand: product.brand?.slug?.trim() || undefined,
  }
}

function similarHref(filters: Pick<DesignRelatedFilters, 'tipologia' | 'stile' | 'ambiente'>): string {
  const params = new URLSearchParams()
  params.set('world', 'design')
  params.set('category', CATALOG_DESIGN_CATEGORY_SLUG)
  if (filters.tipologia) params.set('tipologia', filters.tipologia)
  if (filters.stile) params.set('stile', filters.stile)
  if (filters.ambiente) params.set('ambiente', filters.ambiente)
  return `/negozio?${params.toString()}`
}

function similarSearch(
  params: DesignRelatedCatalogParams,
): DesignRelatedSearch | null {
  if (!params.tipologia && !params.stile && !params.ambiente && !params.brand) return null
  return {
    kind: 'similar',
    params,
    href: similarHref({
      tipologia: params.tipologia,
      stile: params.stile,
      ambiente: params.ambiente,
    }),
  }
}

function sameCatalogParams(a: DesignRelatedCatalogParams, b: DesignRelatedCatalogParams): boolean {
  return (
    a.q === b.q &&
    a.category === b.category &&
    a.brand === b.brand &&
    a.tipologia === b.tipologia &&
    a.stile === b.stile &&
    a.ambiente === b.ambiente
  )
}

export function buildDesignRelatedSearches(filters: DesignRelatedFilters): DesignRelatedSearch[] {
  const searches: DesignRelatedSearch[] = []

  if (filters.designerName) {
    searches.push({
      kind: 'designer',
      params: { world: 'design', q: filters.designerName },
      href: buildDesignerProjectsHref(filters.designerName),
    })
  }

  const tight = similarSearch({
    world: 'design',
    category: CATALOG_DESIGN_CATEGORY_SLUG,
    tipologia: filters.tipologia,
    stile: filters.stile,
    ambiente: filters.ambiente,
    brand:
      !filters.tipologia && !filters.stile && !filters.ambiente ? filters.brand : undefined,
  })
  const loose = similarSearch({
    world: 'design',
    category: CATALOG_DESIGN_CATEGORY_SLUG,
    tipologia: filters.tipologia,
    brand: filters.tipologia ? undefined : filters.brand,
  })

  if (tight) searches.push(tight)
  if (loose && (!tight || !sameCatalogParams(loose.params, tight.params))) searches.push(loose)

  return searches
}

export function pickDesignRelatedProducts(
  items: ReadonlyArray<ProductCardDTO>,
  currentSlug: string,
  limit = DESIGN_RELATED_LIMIT,
): ProductCardDTO[] {
  const seen = new Set<string>()
  const next: ProductCardDTO[] = []
  for (const item of items) {
    const slug = item.slug?.trim()
    if (!slug || slug === currentSlug || seen.has(slug)) continue
    seen.add(slug)
    next.push(item)
    if (next.length >= limit) break
  }
  return next
}
