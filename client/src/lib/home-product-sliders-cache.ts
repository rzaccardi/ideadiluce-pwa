import type { HomeProductSliderDTO } from '@/types/home-product-sliders'

const TTL_MS = 48 * 60 * 60 * 1000

type Entry = {
  expiresAt: number
  data: HomeProductSliderDTO[]
}

const cache = new Map<string, Entry>()

function cacheKey(locale: string): string {
  return `${locale.trim().toUpperCase() || 'IT'}|v12`
}

export function readHomeProductSlidersClientCache(locale: string): HomeProductSliderDTO[] | null {
  const entry = cache.get(cacheKey(locale))
  if (!entry || entry.expiresAt <= Date.now()) {
    if (entry) cache.delete(cacheKey(locale))
    return null
  }
  return entry.data
}

export function writeHomeProductSlidersClientCache(
  locale: string,
  data: HomeProductSliderDTO[],
): void {
  if (data.length === 0) return
  cache.set(cacheKey(locale), {
    expiresAt: Date.now() + TTL_MS,
    data,
  })
}

export function resetHomeProductSlidersClientCache(): void {
  cache.clear()
}
