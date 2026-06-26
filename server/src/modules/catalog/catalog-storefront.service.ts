import {
  fetchArflyBrands,
  fetchArflyCategories,
  fetchArflyProductList,
  isArflyConfigured,
} from '../../adapters/arfly/arflyClient.js'
import { mapArflyListResponse } from '../../adapters/arfly/arflyMapper.js'
import type { HubLocale } from '../../lib/hub-locale.js'
import { parseHubLocale } from '../../lib/hub-locale.js'
import type { CategoryDTO, ProductListDTO } from '../../types/dto.js'
import type { OdooCallContext } from '../../adapters/odoo/odooClient.js'
import { enrichProductCardsWithStock } from './catalog-stock.enrich.js'

export type BrandListItemDTO = {
  slug: string
  name: string
  productCount?: number
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

export const catalogStorefrontService = {
  parseLocale(input: unknown): HubLocale {
    return parseHubLocale(input)
  },

  async listCategories(localeInput?: string): Promise<CategoryDTO[]> {
    if (!isArflyConfigured()) return []
    const locale = parseHubLocale(localeInput)
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
      if (fromApi.length) return fromApi
      return categoriesFromProductList(locale)
    } catch {
      return categoriesFromProductList(locale)
    }
  },

  async listBrands(localeInput?: string): Promise<BrandListItemDTO[]> {
    if (!isArflyConfigured()) return []
    const locale = parseHubLocale(localeInput)
    try {
      const res = await fetchArflyBrands(locale)
      const fromApi = res.items
        .filter((b) => b.slug)
        .map((b) => ({
          slug: b.slug!,
          name: b.name ?? b.slug!,
        }))
      if (fromApi.length) return fromApi
      return brandsFromProductList(locale)
    } catch {
      return brandsFromProductList(locale)
    }
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
    const effectiveQ = options.q?.trim() ?? ''

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
    const enrichedItems = await enrichProductCardsWithStock(
      ctx,
      mapped.items.map((item, index) => ({
        ...item,
        odooTemplateId: raw.items[index]?.id ?? null,
      })),
    )
    return { ...mapped, items: enrichedItems }
  },
}
