import {
  fetchArflyBrands,
  fetchArflyCategories,
  fetchArflyProductDetail,
  fetchArflyProductList,
  isArflyConfigured,
} from '../../adapters/arfly/arflyClient.js'
import { mapArflyListResponse } from '../../adapters/arfly/arflyMapper.js'
import type { HubLocale } from '../../lib/hub-locale.js'
import { parseHubLocale } from '../../lib/hub-locale.js'
import type { CategoryDTO, ProductListDTO } from '../../types/dto.js'
import type { OdooCallContext } from '../../adapters/odoo/odooClient.js'
import { enrichProductCardsWithStock, type ProductCardStockHint } from './catalog-stock.enrich.js'
import { sanitizeCatalogSearchQuery } from './catalog-search-guard.js'

export type BrandListItemDTO = {
  slug: string
  name: string
  productCount?: number
}

async function enrichProductCardsWithSkuFromArfly(
  items: ProductCardStockHint[],
  locale: HubLocale,
  pricing: { partnerId?: number; pricelistId?: number },
): Promise<ProductCardStockHint[]> {
  return Promise.all(
    items.map(async (item) => {
      if (item.sku?.trim() || item.odooTemplateId == null) return item
      try {
        const detail = await fetchArflyProductDetail(item.odooTemplateId, locale, pricing)
        const variant = detail.product.variants?.[0]
        const sku = variant?.manufacturer_code?.trim() || variant?.ced?.trim() || null
        return sku ? { ...item, sku } : item
      } catch {
        return item
      }
    }),
  )
}

async function categoriesFromProductList(locale: HubLocale): Promise<CategoryDTO[]> {
  const bySlug = new Map<string, CategoryDTO>()
  let page = 1
  while (page <= 20) {
    const list = await fetchArflyProductList({ locale, page, perPage: 100 })
    for (const item of list.items) {
      for (const c of item.categories ?? []) {
        if (!c.slug) continue
        bySlug.set(c.slug, {
          id: String(c.id ?? c.slug),
          slug: c.slug,
          name: c.name ?? c.slug,
          parentId: c.parent_id != null ? String(c.parent_id) : null,
        })
      }
    }
    if (page >= list.total_pages) break
    page += 1
  }
  return [...bySlug.values()].sort((a, b) => a.name.localeCompare(b.name, 'it'))
}

async function brandsFromProductList(locale: HubLocale): Promise<BrandListItemDTO[]> {
  const bySlug = new Map<string, BrandListItemDTO>()
  let page = 1
  while (page <= 20) {
    const list = await fetchArflyProductList({ locale, page, perPage: 100 })
    for (const item of list.items) {
      const b = item.brand
      if (!b?.slug) continue
      const existing = bySlug.get(b.slug)
      if (existing) {
        existing.productCount = (existing.productCount ?? 0) + 1
      } else {
        bySlug.set(b.slug, {
          slug: b.slug,
          name: b.name ?? b.slug,
          productCount: 1,
        })
      }
    }
    if (page >= list.total_pages) break
    page += 1
  }
  return [...bySlug.values()].sort((a, b) => a.name.localeCompare(b.name, 'it'))
}

const TAXONOMY_CACHE_TTL_MS = 10 * 60 * 1000

type TaxonomyCacheEntry<T> = { expiresAt: number; value: T }

const categoriesCache = new Map<HubLocale, TaxonomyCacheEntry<CategoryDTO[]>>()
const brandsCache = new Map<HubLocale, TaxonomyCacheEntry<BrandListItemDTO[]>>()

function readTaxonomyCache<T>(map: Map<HubLocale, TaxonomyCacheEntry<T>>, locale: HubLocale): T | null {
  const entry = map.get(locale)
  if (!entry || entry.expiresAt <= Date.now()) return null
  return entry.value
}

function writeTaxonomyCache<T>(
  map: Map<HubLocale, TaxonomyCacheEntry<T>>,
  locale: HubLocale,
  value: T,
) {
  map.set(locale, { expiresAt: Date.now() + TAXONOMY_CACHE_TTL_MS, value })
}

export const catalogStorefrontService = {
  parseLocale(input: unknown): HubLocale {
    return parseHubLocale(input)
  },

  async listCategories(localeInput?: string): Promise<CategoryDTO[]> {
    if (!isArflyConfigured()) return []
    const locale = parseHubLocale(localeInput)
    const cached = readTaxonomyCache(categoriesCache, locale)
    if (cached) return cached

    let items: CategoryDTO[]
    try {
      const res = await fetchArflyCategories(locale)
      const fromApi = res.items
        .filter((c) => c.slug)
        .map((c) => ({
          id: String(c.id ?? c.slug),
          slug: c.slug!,
          name: c.name ?? c.slug!,
          parentId: c.parent_id != null ? String(c.parent_id) : null,
        }))
      items = fromApi.length ? fromApi : await categoriesFromProductList(locale)
    } catch {
      items = await categoriesFromProductList(locale)
    }

    writeTaxonomyCache(categoriesCache, locale, items)
    return items
  },

  async getCategoryBySlug(slug: string, localeInput?: string): Promise<CategoryDTO | null> {
    const items = await this.listCategories(localeInput)
    return items.find((c) => c.slug === slug) ?? null
  },

  async listBrands(localeInput?: string): Promise<BrandListItemDTO[]> {
    if (!isArflyConfigured()) return []
    const locale = parseHubLocale(localeInput)
    const cached = readTaxonomyCache(brandsCache, locale)
    if (cached) return cached

    let items: BrandListItemDTO[]
    try {
      const res = await fetchArflyBrands(locale)
      const fromApi = res.items
        .filter((b) => b.slug)
        .map((b) => ({
          slug: b.slug!,
          name: b.name ?? b.slug!,
        }))
      items = fromApi.length ? fromApi : await brandsFromProductList(locale)
    } catch {
      items = await brandsFromProductList(locale)
    }

    writeTaxonomyCache(brandsCache, locale, items)
    return items
  },

  async getBrandBySlug(slug: string, localeInput?: string): Promise<BrandListItemDTO | null> {
    const items = await this.listBrands(localeInput)
    return items.find((b) => b.slug === slug) ?? null
  },

  async listProducts(
    ctx: OdooCallContext,
    options: {
    locale?: string
    page?: number
    pageSize?: number
    q?: string
    categorySlug?: string
    brandSlug?: string
    partnerId?: number
    pricelistId?: number
  }): Promise<ProductListDTO> {
    const locale = parseHubLocale(options.locale)
    const page = Math.max(1, Number(options.page) || 1)
    const pageSize = Math.min(60, Math.max(1, Number(options.pageSize) || 24))
    const effectiveQ = sanitizeCatalogSearchQuery(options.q) ?? ''

    if (!isArflyConfigured()) {
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

    const raw = await fetchArflyProductList({
      locale,
      page,
      perPage: pageSize,
      q: effectiveQ || undefined,
      category: options.categorySlug,
      brand: options.brandSlug,
      partnerId: options.partnerId,
      pricelistId: options.pricelistId,
    })
    const mapped = mapArflyListResponse(raw, locale)
    const withTemplateIds: ProductCardStockHint[] = mapped.items.map((item, index) => ({
      ...item,
      odooTemplateId: raw.items[index]?.id ?? null,
    }))
    const withSku = await enrichProductCardsWithSkuFromArfly(withTemplateIds, locale, {
      partnerId: options.partnerId,
      pricelistId: options.pricelistId,
    })
    const enrichedItems = await enrichProductCardsWithStock(ctx, withSku)
    return { ...mapped, items: enrichedItems }
  },
}
