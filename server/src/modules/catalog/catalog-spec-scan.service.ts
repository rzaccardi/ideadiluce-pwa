import { fetchArflyProductList } from '../../adapters/arfly/arflyClient.js'
import { mapArflyListItem } from '../../adapters/arfly/arflyMapper.js'
import type { HubLocale } from '../../lib/hub-locale.js'
import type { ProductCardDTO } from '../../types/dto.js'
import type { ProductCardStockHint } from './catalog-stock.enrich.js'
import {
  hasActiveSpecFilters,
  productMatchesCatalogTextQuery,
  productMatchesSpecFilter,
  type CatalogSpecFilters,
} from './catalog-spec-filter.js'

const SPEC_SCAN_PER_PAGE = 100
const MAX_SPEC_SCAN_PAGES = 20

export type SpecScanMatch = {
  product: ProductCardDTO
  odooTemplateId: number | null
}

export async function scanArflyProductsMatchingSpec(input: {
  locale: HubLocale
  specFilters: CatalogSpecFilters
  textQuery?: string
  categorySlug?: string
  brandSlug?: string
  partnerId?: number
  pricelistId?: number
}): Promise<SpecScanMatch[]> {
  const matches: SpecScanMatch[] = []
  let page = 1
  let totalPages = 1

  while (page <= totalPages && page <= MAX_SPEC_SCAN_PAGES) {
    const raw = await fetchArflyProductList({
      locale: input.locale,
      page,
      perPage: SPEC_SCAN_PER_PAGE,
      q: input.textQuery || undefined,
      category: input.categorySlug,
      brand: input.brandSlug,
      partnerId: input.partnerId,
      pricelistId: input.pricelistId,
    })

    totalPages = raw.total_pages

    for (let index = 0; index < raw.items.length; index += 1) {
      const arflyItem = raw.items[index]!
      const product = mapArflyListItem(arflyItem, input.locale)

      if (!productMatchesSpecFilter(product, input.specFilters)) continue
      if (input.textQuery && !productMatchesCatalogTextQuery(product, input.textQuery)) continue

      matches.push({
        product,
        odooTemplateId: arflyItem.id ?? null,
      })
    }

    page += 1
  }

  return matches
}

export function paginateSpecScanMatches(
  matches: ReadonlyArray<SpecScanMatch>,
  page: number,
  pageSize: number,
): {
  slice: SpecScanMatch[]
  total: number
  totalPages: number
  page: number
  pageSize: number
  hasNextPage: boolean
  hasPreviousPage: boolean
} {
  const safePage = Math.max(1, page)
  const safeSize = Math.min(60, Math.max(1, pageSize))
  const total = matches.length
  const totalPages = Math.max(1, Math.ceil(total / safeSize))
  const clampedPage = Math.min(safePage, totalPages)
  const start = (clampedPage - 1) * safeSize

  return {
    slice: matches.slice(start, start + safeSize),
    total,
    totalPages,
    page: clampedPage,
    pageSize: safeSize,
    hasNextPage: clampedPage < totalPages,
    hasPreviousPage: clampedPage > 1,
  }
}

export function toStockHints(matches: ReadonlyArray<SpecScanMatch>): ProductCardStockHint[] {
  return matches.map(({ product, odooTemplateId }) => ({
    ...product,
    odooTemplateId,
  }))
}

export function shouldUseSpecScan(filters: CatalogSpecFilters): boolean {
  return hasActiveSpecFilters(filters)
}
