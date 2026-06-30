import { afterEach, describe, expect, it, vi } from 'vitest'
import { resetHomeProductSlidersCache } from './home-product-sliders.cache.js'
import { homeProductSlidersService } from './home-product-sliders.service.js'
import type { HomeProductSliderDTO } from './home-product-sliders.types.js'

const ctx = { correlationId: 'test-home-sliders' }

const sampleSliders: HomeProductSliderDTO[] = [
  {
    key: 'top-technical',
    products: [
      {
        slug: 'g4-20w',
        locale: 'IT',
        name: 'Lampada G4',
        shortDescription: null,
        priceCents: 500,
        priceDisplayMode: 'ex_vat',
        currency: 'EUR',
        imageUrl: 'https://example.test/img.jpg',
        categorySlug: null,
        inStock: true,
      },
    ],
  },
  {
    key: 'room-soggiorno',
    products: [
      {
        slug: 'sospensione-1',
        locale: 'IT',
        name: 'Sospensione',
        shortDescription: null,
        priceCents: 12000,
        priceDisplayMode: 'ex_vat',
        currency: 'EUR',
        imageUrl: null,
        categorySlug: null,
        inStock: false,
      },
    ],
  },
]

describe('homeProductSlidersService.list cache', () => {
  afterEach(() => {
    resetHomeProductSlidersCache()
    vi.restoreAllMocks()
  })

  it('riusa la cache in-process tra richieste successive', async () => {
    const loadSpy = vi
      .spyOn(homeProductSlidersService, 'load')
      .mockResolvedValue(sampleSliders)

    const first = await homeProductSlidersService.list(ctx, { locale: 'IT' })
    const second = await homeProductSlidersService.list(ctx, { locale: 'IT' })

    expect(loadSpy).toHaveBeenCalledTimes(1)
    expect(first).toEqual(sampleSliders)
    expect(second).toEqual(sampleSliders)
    expect(first[0]?.products[0]?.slug).toBe('g4-20w')
    expect(first[0]?.products[0]?.name).toBeTruthy()
  })

  it('deduplica richieste concorrenti sulla stessa chiave', async () => {
    let resolveLoad!: (value: HomeProductSliderDTO[]) => void
    const loadPromise = new Promise<HomeProductSliderDTO[]>((resolve) => {
      resolveLoad = resolve
    })

    const loadSpy = vi.spyOn(homeProductSlidersService, 'load').mockReturnValue(loadPromise)

    const p1 = homeProductSlidersService.list(ctx, { locale: 'IT' })
    const p2 = homeProductSlidersService.list(ctx, { locale: 'IT' })

    expect(loadSpy).toHaveBeenCalledTimes(1)

    resolveLoad(sampleSliders)
    const [r1, r2] = await Promise.all([p1, p2])
    expect(r1).toEqual(sampleSliders)
    expect(r2).toEqual(sampleSliders)
  })

  it('usa chiavi distinte per locale diverso', async () => {
    const loadSpy = vi
      .spyOn(homeProductSlidersService, 'load')
      .mockResolvedValue(sampleSliders)

    await homeProductSlidersService.list(ctx, { locale: 'IT' })
    await homeProductSlidersService.list(ctx, { locale: 'EN' })

    expect(loadSpy).toHaveBeenCalledTimes(2)
  })
})
