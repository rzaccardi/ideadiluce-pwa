import type { HubLocale } from '../../lib/hub-locale.js'
import type { HomeProductSliderDTO } from './home-product-sliders.types.js'

/** 48 ore — slider homepage aggiornati al massimo due volte al giorno. */
export const HOME_PRODUCT_SLIDERS_CACHE_TTL_MS = 48 * 60 * 60 * 1000

export const HOME_PRODUCT_SLIDERS_CACHE_MAX_AGE_SEC = 48 * 60 * 60

type CacheEntry = {
  expiresAt: number
  value: HomeProductSliderDTO[]
}

const cache = new Map<string, CacheEntry>()
const inflight = new Map<string, Promise<HomeProductSliderDTO[]>>()

export function buildHomeProductSlidersCacheKey(options: {
  locale: HubLocale
  partnerId?: number
  pricelistId?: number
}): string {
  return `${options.locale}|${options.partnerId ?? 0}|${options.pricelistId ?? 0}|v12`
}

export function readHomeProductSlidersCache(key: string): HomeProductSliderDTO[] | null {
  const entry = cache.get(key)
  if (!entry || entry.expiresAt <= Date.now()) {
    if (entry) cache.delete(key)
    return null
  }
  return entry.value
}

export function writeHomeProductSlidersCache(key: string, value: HomeProductSliderDTO[]): void {
  cache.set(key, {
    expiresAt: Date.now() + HOME_PRODUCT_SLIDERS_CACHE_TTL_MS,
    value,
  })
}

export function getHomeProductSlidersInflight(
  key: string,
): Promise<HomeProductSliderDTO[]> | undefined {
  return inflight.get(key)
}

export function setHomeProductSlidersInflight(
  key: string,
  promise: Promise<HomeProductSliderDTO[]>,
): void {
  inflight.set(key, promise)
}

export function clearHomeProductSlidersInflight(key: string): void {
  inflight.delete(key)
}

export function resetHomeProductSlidersCache(): void {
  cache.clear()
  inflight.clear()
}
