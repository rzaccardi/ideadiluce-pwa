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
import { enrichProductCardsWithOdooPricing } from './catalog-pricing.enrich.js'
import { enrichProductCardsWithStock, type ProductCardStockHint } from './catalog-stock.enrich.js'
import type { PricingContext } from '../pricing/pricelist.service.js'
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

type SliderPricingInput = PricingContext | { partnerId?: number | null; pricelistId?: number | null }

async function resolveCardsFromTemplateIds(
  ctx: OdooCallContext,
  templateIds: number[],
  locale: HubLocale,
  pricing?: SliderPricingInput | null,
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
  const withStock = await enrichProductCardsWithStock(ctx, hints)
  const pricingCtx: PricingContext | null = pricing
    ? {
        segment: 'segment' in pricing ? pricing.segment : 'RETAIL',
        partnerId: pricing.partnerId ?? null,
        pricelistId: pricing.pricelistId ?? null,
        personalized:
          'personalized' in pricing
            ? pricing.personalized
            : Boolean(pricing.partnerId || pricing.pricelistId),
      }
    : null
  return enrichProductCardsWithOdooPricing(ctx, withStock, pricingCtx)
}

const SEGMENT_CATEGORY_SLUG: Record<TopPurchasedSegment, string> = {
  design: 'arredo',
  technical: 'tecnico',
}

function sliderPartnerIds(pricing: SliderPricingInput): {
  partnerId?: number
  pricelistId?: number
} {
  return {
    partnerId: pricing.partnerId ?? undefined,
    pricelistId: pricing.pricelistId ?? undefined,
  }
}

function sliderPricing(pricing?: SliderPricingInput | null): PricingContext | null {
  if (!pricing) return null
  return {
    segment: 'segment' in pricing ? pricing.segment : 'RETAIL',
    partnerId: pricing.partnerId ?? null,
    pricelistId: pricing.pricelistId ?? null,
    personalized:
      'personalized' in pricing
        ? pricing.personalized
        : Boolean(pricing.partnerId || pricing.pricelistId),
  }
}

async function topPurchasedSlider(
  ctx: OdooCallContext,
  locale: HubLocale,
  pricing: SliderPricingInput,
  segment: TopPurchasedSegment,
  fallbackQuery: string,
): Promise<ProductCardDTO[]> {
  const categorySlug = SEGMENT_CATEGORY_SLUG[segment]
  const pricingCtx = sliderPricing(pricing)
  const ids = sliderPartnerIds(pricing)

  if (!odooSearchHintsAvailable()) {
    const list = await catalogStorefrontService.listProducts(ctx, {
      locale,
      page: 1,
      pageSize: SLIDER_LIMIT,
      categorySlug,
      partnerId: ids.partnerId,
      pricelistId: ids.pricelistId,
      pricing: pricingCtx,
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
    partnerId: ids.partnerId,
    pricelistId: ids.pricelistId,
    pricing: pricingCtx,
  })
  if (list.items.length === 0) {
    list = await catalogStorefrontService.listProducts(ctx, {
      locale,
      page: 1,
      pageSize: SLIDER_LIMIT,
      categorySlug,
      partnerId: ids.partnerId,
      pricelistId: ids.pricelistId,
      pricing: pricingCtx,
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
  pricing: SliderPricingInput,
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
    ...sliderPartnerIds(pricing),
    pricing: sliderPricing(pricing),
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
  pricing: SliderPricingInput,
  key: Extract<HomeProductSliderKey, `room-${string}`>,
): Promise<ProductCardDTO[]> {
  const ambiente = ROOM_AMBIENTE[key]
  const list = await catalogStorefrontService.listProducts(ctx, {
    locale,
    page: 1,
    pageSize: SLIDER_LIMIT,
    ambiente,
    categorySlug: 'arredo',
    ...sliderPartnerIds(pricing),
    pricing: sliderPricing(pricing),
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
      pricing?: PricingContext | null
    },
  ): Promise<HomeProductSliderDTO[]> {
    const locale = parseHubLocale(options.locale)
    const pricing = options.pricing ?? {
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
      pricing?: PricingContext | null
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
