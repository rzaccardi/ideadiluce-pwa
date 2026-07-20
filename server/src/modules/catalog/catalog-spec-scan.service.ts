import {
  fetchOdooCatalogProductSearch,
  isOdooCatalogConfigured,
} from '../../adapters/odoo-catalog/odooCatalogClient.js'
import { mapOdooCatalogListResponse } from '../../adapters/odoo-catalog/odooCatalogMapper.js'
import type { HubLocale } from '../../lib/hub-locale.js'
import type { ProductCardDTO } from '../../types/dto.js'
import type { ProductCardStockHint } from './catalog-stock.enrich.js'
import {
  productMatchesCatalogTextQuery,
  type CatalogSpecFilters,
} from './catalog-spec-filter.js'
import { canonicalizeBrandSlug } from './odoo-catalog-slug.js'

const SPEC_SCAN_PER_PAGE = 100
const MAX_SPEC_SCAN_PAGES = 20

export type SpecScanMatch = {
  product: ProductCardDTO
  odooTemplateId: number | null
}

/** Scan filtri specs via search live Odoo (non indice cache). */
export async function scanOdooCatalogProductsMatchingSpec(input: {
  locale: HubLocale
  specFilters: CatalogSpecFilters
  textQuery?: string
  categorySlug?: string
  brandSlug?: string
  partnerId?: number
  pricelistId?: number
}): Promise<SpecScanMatch[]> {
  if (!isOdooCatalogConfigured()) return []

  const matches: SpecScanMatch[] = []
  let page = 1
  let totalPages = 1

  while (page <= totalPages && page <= MAX_SPEC_SCAN_PAGES) {
    const raw = await fetchOdooCatalogProductSearch({
      locale: input.locale,
      page,
      per_page: SPEC_SCAN_PER_PAGE,
      q: input.textQuery || undefined,
      category: input.categorySlug,
      brand: input.brandSlug ? canonicalizeBrandSlug(input.brandSlug) : undefined,
      attacco: input.specFilters.attacco,
      color_temp: input.specFilters.colorTemp,
    })
    const chunk = mapOdooCatalogListResponse(raw, input.locale)
    totalPages = chunk.totalPages

    for (const product of chunk.items) {
      const hint: ProductCardStockHint = {
        ...product,
        odooTemplateId: product.odooTemplateId ?? null,
      }
      if (input.textQuery && !productMatchesCatalogTextQuery(hint, input.textQuery)) continue
      matches.push({
        product,
        odooTemplateId: hint.odooTemplateId ?? null,
      })
    }

    if (page >= totalPages) break
    page += 1
  }

  return matches
}
