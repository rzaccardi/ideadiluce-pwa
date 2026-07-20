import { isOdooCatalogConfigured } from '../../adapters/odoo-catalog/odooCatalogClient.js'
import type { HubLocale } from '../../lib/hub-locale.js'
import { parseHubLocale } from '../../lib/hub-locale.js'
import type { CategoryDTO, ProductListDTO } from '../../types/dto.js'
import type { OdooCallContext } from '../../adapters/odoo/odooClient.js'
import { sanitizeCatalogSearchQuery } from './catalog-search-guard.js'
import {
  queryOdooCatalogIndex,
  type BrandListItemDTO,
} from './odoo-catalog-index.service.js'
import {
  sanitizeAttaccoParam,
  sanitizeColorTempParam,
} from './catalog-spec-filter.js'
import type { PricingContext } from '../pricing/pricelist.service.js'
import {
  listCatalogBrandsLive,
  listCatalogCategoriesLive,
  searchCatalogProductsLive,
} from './catalog-odoo-search.service.js'
import { brandSlugLookupKeys } from './odoo-catalog-slug.js'

export type { BrandListItemDTO }

export const catalogStorefrontService = {
  parseLocale(input: unknown): HubLocale {
    return parseHubLocale(input)
  },

  async listCategories(localeInput?: string): Promise<CategoryDTO[]> {
    return listCatalogCategoriesLive(localeInput)
  },

  async getCategoryBySlug(slug: string, localeInput?: string): Promise<CategoryDTO | null> {
    const items = await this.listCategories(localeInput)
    return items.find((c) => c.slug === slug) ?? null
  },

  async listBrands(localeInput?: string): Promise<BrandListItemDTO[]> {
    return listCatalogBrandsLive(localeInput)
  },

  async getBrandBySlug(slug: string, localeInput?: string): Promise<BrandListItemDTO | null> {
    const items = await this.listBrands(localeInput)
    const keys = new Set(brandSlugLookupKeys(slug))
    return items.find((b) => keys.has(b.slug.toLowerCase())) ?? null
  },

  /**
   * Listing negozio filtrato: **Odoo live** `/api/v2/products/search`.
   * Per suggest searchbox passare `cacheOnly: true` (unica lettura indice cache).
   */
  async listProducts(
    ctx: OdooCallContext,
    options: {
      locale?: string
      page?: number
      pageSize?: number
      q?: string
      world?: 'design' | 'technical' | string
      categorySlug?: string
      subcategorySlug?: string
      brandSlug?: string
      tipologia?: string
      ambiente?: string
      stile?: string
      attacco?: string
      wattaggio?: string | number
      wattaggioMin?: string | number
      wattaggioMax?: string | number
      colorTemp?: string
      tag?: string
      sort?: string
      partnerId?: number
      pricelistId?: number
      pricing?: PricingContext | null
      /** Solo typeahead: forza cache locale invece di search Odoo. */
      cacheOnly?: boolean
    },
  ): Promise<ProductListDTO> {
    const locale = parseHubLocale(options.locale)
    const page = Math.max(1, Number(options.page) || 1)
    const pageSize = Math.min(100, Math.max(1, Number(options.pageSize) || 24))
    const effectiveQ = sanitizeCatalogSearchQuery(options.q) ?? ''
    const attacco = sanitizeAttaccoParam(options.attacco)
    const colorTemp = sanitizeColorTempParam(options.colorTemp)

    if (!isOdooCatalogConfigured()) {
      return {
        items: [],
        page: 1,
        pageSize,
        total: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      }
    }

    if (options.cacheOnly) {
      return queryOdooCatalogIndex({
        locale,
        q: effectiveQ || undefined,
        page,
        pageSize,
        categorySlug: options.categorySlug,
        brandSlug: options.brandSlug,
        attacco,
        colorTemp,
      })
    }

    return searchCatalogProductsLive(ctx, {
      locale,
      page,
      pageSize,
      q: effectiveQ || undefined,
      world: options.world,
      categorySlug: options.categorySlug,
      subcategorySlug: options.subcategorySlug,
      brandSlug: options.brandSlug,
      tipologia: options.tipologia,
      ambiente: options.ambiente,
      stile: options.stile,
      attacco,
      wattaggio: options.wattaggio,
      wattaggioMin: options.wattaggioMin,
      wattaggioMax: options.wattaggioMax,
      colorTemp,
      tag: options.tag,
      sort: options.sort,
      partnerId: options.partnerId,
      pricelistId: options.pricelistId,
      pricing: options.pricing,
      enrichStock: true,
    })
  },
}
