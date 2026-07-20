import { fetchOdooCatalogProductDetail, isOdooCatalogConfigured } from '../../adapters/odoo-catalog/odooCatalogClient.js'
import { mapOdooCatalogListItem } from '../../adapters/odoo-catalog/odooCatalogMapper.js'
import {
  fetchTopPurchasedProducts,
  odooSearchHintsAvailable,
  type TopPurchasedSegment,
} from '../../adapters/odoo/odooTopPurchasedSearchHints.js'
import type { OdooCallContext } from '../../adapters/odoo/odooClient.js'
import { parseHubLocale, type HubLocale } from '../../lib/hub-locale.js'
import type { ProductCardDTO } from '../../types/dto.js'
import { enrichProductCardsWithStock, type ProductCardStockHint } from './catalog-stock.enrich.js'
import { catalogStorefrontService } from './catalog-storefront.service.js'
import {
  buildHomeProductSlidersCacheKey,
  clearHomeProductSlidersInflight,
  getHomeProductSlidersInflight,
  readHomeProductSlidersCache,
  setHomeProductSlidersInflight,
  writeHomeProductSlidersCache,
} from './home-product-sliders.cache.js'
import type { HomeProductSliderDTO, HomeProductSliderKey } from './home-product-sliders.types.js'
import { HOME_SLIDER_PRODUCT_COUNT } from './home-product-sliders.types.js'

export type { HomeProductSliderDTO, HomeProductSliderKey } from './home-product-sliders.types.js'
export { HOME_SLIDER_PRODUCT_COUNT } from './home-product-sliders.types.js'

const LOOKBACK_DAYS = 90
const SLIDER_LIMIT = HOME_SLIDER_PRODUCT_COUNT

/** Slug taxonomy `ambiente` (contratto Odoo R1) — niente q= testuale. */
const ROOM_AMBIENTE: Record<Extract<HomeProductSliderKey, `room-${string}`>, string> = {
  'room-soggiorno': 'soggiorno',
  'room-cucina': 'cucina',
  'room-bagno': 'bagno',
}

async function resolveCardsFromTemplateIds(
  ctx: OdooCallContext,
  templateIds: number[],
  locale: HubLocale,
  _pricing: { partnerId?: number; pricelistId?: number },
): Promise<ProductCardDTO[]> {
  if (!isOdooCatalogConfigured() || templateIds.length === 0) return []

  const resolved = await Promise.all(
    templateIds.map(async (templateId): Promise<ProductCardStockHint | null> => {
      try {
        const detail = await fetchOdooCatalogProductDetail(templateId, locale)
        const card = mapOdooCatalogListItem(detail.product, locale)
        return { ...card, odooTemplateId: templateId }
      } catch {
        // prodotto non pubblicato su OdooCatalog
        return null
      }
    }),
  )
  const hints = resolved.filter((item): item is ProductCardStockHint => item != null)

  if (hints.length === 0) return []
  return enrichProductCardsWithStock(ctx, hints)
}

const SEGMENT_CATEGORY_SLUG: Record<TopPurchasedSegment, string> = {
  design: 'arredo',
  technical: 'tecnico',
}

async function topPurchasedSlider(
  ctx: OdooCallContext,
  locale: HubLocale,
  pricing: { partnerId?: number; pricelistId?: number },
  segment: TopPurchasedSegment,
  fallbackQuery: string,
): Promise<ProductCardDTO[]> {
  const categorySlug = SEGMENT_CATEGORY_SLUG[segment]

  if (!odooSearchHintsAvailable()) {
    const list = await catalogStorefrontService.listProducts(ctx, {
      locale,
      page: 1,
      pageSize: SLIDER_LIMIT,
      categorySlug,
      partnerId: pricing.partnerId,
      pricelistId: pricing.pricelistId,
    })
    return list.items.slice(0, SLIDER_LIMIT)
  }

  const ranked = await fetchTopPurchasedProducts(ctx, {
    lookbackDays: LOOKBACK_DAYS,
    limit: SLIDER_LIMIT,
    segment,
    fetchMultiplier: 12,
  })
  const cards = await resolveCardsFromTemplateIds(
    ctx,
    ranked.map((item) => item.productTemplateId),
    locale,
    pricing,
  )
  if (cards.length >= SLIDER_LIMIT) return cards.slice(0, SLIDER_LIMIT)

  let list = await catalogStorefrontService.listProducts(ctx, {
    locale,
    page: 1,
    pageSize: SLIDER_LIMIT,
    q: fallbackQuery,
    categorySlug,
    partnerId: pricing.partnerId,
    pricelistId: pricing.pricelistId,
  })
  if (list.items.length === 0) {
    list = await catalogStorefrontService.listProducts(ctx, {
      locale,
      page: 1,
      pageSize: SLIDER_LIMIT,
      categorySlug,
      partnerId: pricing.partnerId,
      pricelistId: pricing.pricelistId,
    })
  }
  const merged = [...cards]
  for (const item of list.items) {
    if (merged.length >= SLIDER_LIMIT) break
    if (merged.some((existing) => existing.slug === item.slug)) continue
    merged.push(item)
  }
  return merged.slice(0, SLIDER_LIMIT)
}

async function inStockTopSlider(
  ctx: OdooCallContext,
  locale: HubLocale,
  pricing: { partnerId?: number; pricelistId?: number },
): Promise<ProductCardDTO[]> {
  if (!odooSearchHintsAvailable()) return []

  const ranked = await fetchTopPurchasedProducts(ctx, {
    lookbackDays: LOOKBACK_DAYS,
    limit: SLIDER_LIMIT * 3,
    fetchMultiplier: 8,
  })
  const cards = await resolveCardsFromTemplateIds(
    ctx,
    ranked.map((item) => item.productTemplateId),
    locale,
    pricing,
  )
  const inStock = cards.filter((card) => card.inStock)
  if (inStock.length >= SLIDER_LIMIT) return inStock.slice(0, SLIDER_LIMIT)

  const fallback = await catalogStorefrontService.listProducts(ctx, {
    locale,
    page: 1,
    pageSize: SLIDER_LIMIT,
    q: 'lampada',
    partnerId: pricing.partnerId,
    pricelistId: pricing.pricelistId,
  })
  const merged = [...inStock]
  for (const item of fallback.items) {
    if (merged.length >= SLIDER_LIMIT) break
    if (!item.inStock) continue
    if (merged.some((existing) => existing.slug === item.slug)) continue
    merged.push(item)
  }
  return merged.slice(0, SLIDER_LIMIT)
}

async function roomAmbienteSlider(
  ctx: OdooCallContext,
  locale: HubLocale,
  pricing: { partnerId?: number; pricelistId?: number },
  key: Extract<HomeProductSliderKey, `room-${string}`>,
): Promise<ProductCardDTO[]> {
  const ambiente = ROOM_AMBIENTE[key]
  const list = await catalogStorefrontService.listProducts(ctx, {
    locale,
    page: 1,
    pageSize: SLIDER_LIMIT,
    ambiente,
    categorySlug: 'arredo',
    partnerId: pricing.partnerId,
    pricelistId: pricing.pricelistId,
  })
  return list.items.slice(0, SLIDER_LIMIT)
}

export const homeProductSlidersService = {
  async load(
    ctx: OdooCallContext,
    options: {
      locale?: string
      partnerId?: number
      pricelistId?: number
    },
  ): Promise<HomeProductSliderDTO[]> {
    const locale = parseHubLocale(options.locale)
    const pricing = {
      partnerId: options.partnerId,
      pricelistId: options.pricelistId,
    }

    const entries: Array<{ key: HomeProductSliderKey; load: () => Promise<ProductCardDTO[]> }> = [
      { key: 'top-design', load: () => topPurchasedSlider(ctx, locale, pricing, 'design', 'sospensione lampada') },
      { key: 'top-technical', load: () => topPurchasedSlider(ctx, locale, pricing, 'technical', 'alimentatore driver') },
      { key: 'in-stock', load: () => inStockTopSlider(ctx, locale, pricing) },
      { key: 'room-soggiorno', load: () => roomAmbienteSlider(ctx, locale, pricing, 'room-soggiorno') },
      { key: 'room-cucina', load: () => roomAmbienteSlider(ctx, locale, pricing, 'room-cucina') },
      { key: 'room-bagno', load: () => roomAmbienteSlider(ctx, locale, pricing, 'room-bagno') },
    ]

    const sliders = await Promise.all(
      entries.map(async ({ key, load }) => ({
        key,
        products: await load(),
      })),
    )

    return sliders.filter((slider) => slider.products.length > 0)
  },

  async list(
    ctx: OdooCallContext,
    options: {
      locale?: string
      partnerId?: number
      pricelistId?: number
    },
  ): Promise<HomeProductSliderDTO[]> {
    const locale = parseHubLocale(options.locale)
    const cacheKey = buildHomeProductSlidersCacheKey({
      locale,
      partnerId: options.partnerId,
      pricelistId: options.pricelistId,
    })

    const cached = readHomeProductSlidersCache(cacheKey)
    if (cached) return cached

    const pending = getHomeProductSlidersInflight(cacheKey)
    if (pending) return pending

    const promise = this.load(ctx, options)
      .then((data) => {
        writeHomeProductSlidersCache(cacheKey, data)
        return data
      })
      .finally(() => {
        clearHomeProductSlidersInflight(cacheKey)
      })

    setHomeProductSlidersInflight(cacheKey, promise)
    return promise
  },
}
