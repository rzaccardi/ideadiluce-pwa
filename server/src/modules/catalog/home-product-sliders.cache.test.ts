import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  HOME_PRODUCT_SLIDERS_CACHE_MAX_AGE_SEC,
  HOME_PRODUCT_SLIDERS_CACHE_TTL_MS,
  buildHomeProductSlidersCacheKey,
  readHomeProductSlidersCache,
  resetHomeProductSlidersCache,
  writeHomeProductSlidersCache,
} from './home-product-sliders.cache.js'
import type { HomeProductSliderDTO } from './home-product-sliders.types.js'

const sample: HomeProductSliderDTO[] = [
  {
    key: 'top-technical',
    products: [
      {
        slug: 'lamp-test-1',
        locale: 'IT',
        name: 'Lampada test',
        shortDescription: null,
        priceCents: 1000,
        priceDisplayMode: 'ex_vat',
        currency: 'EUR',
        imageUrl: null,
        categorySlug: null,
        inStock: true,
      },
    ],
  },
]

describe('home-product-sliders.cache', () => {
  afterEach(() => {
    resetHomeProductSlidersCache()
    vi.useRealTimers()
  })

  it('espone TTL di 48 ore', () => {
    expect(HOME_PRODUCT_SLIDERS_CACHE_TTL_MS).toBe(48 * 60 * 60 * 1000)
    expect(HOME_PRODUCT_SLIDERS_CACHE_MAX_AGE_SEC).toBe(48 * 60 * 60)
  })

  it('costruisce chiave per locale e listino', () => {
    expect(buildHomeProductSlidersCacheKey({ locale: 'IT' })).toBe('IT|0|0|v12')
    expect(buildHomeProductSlidersCacheKey({ locale: 'EN', partnerId: 12, pricelistId: 3 })).toBe(
      'EN|12|3|v12',
    )
  })

  it('legge e scrive fino a scadenza', () => {
    const key = buildHomeProductSlidersCacheKey({ locale: 'IT' })
    expect(readHomeProductSlidersCache(key)).toBeNull()

    writeHomeProductSlidersCache(key, sample)
    expect(readHomeProductSlidersCache(key)).toEqual(sample)
  })

  it('invalida entry scaduta', () => {
    vi.useFakeTimers()
    const key = buildHomeProductSlidersCacheKey({ locale: 'IT' })
    writeHomeProductSlidersCache(key, sample)

    vi.advanceTimersByTime(HOME_PRODUCT_SLIDERS_CACHE_TTL_MS + 1)
    expect(readHomeProductSlidersCache(key)).toBeNull()
  })
})
