import { config } from 'dotenv'
import { resolve } from 'node:path'
import { afterAll, describe, expect, it, vi } from 'vitest'
import { isOdooConfigured } from '../../adapters/odoo/odooClient.js'
import { isOdooCatalogConfigured } from '../../adapters/odoo-catalog/odooCatalogClient.js'
import { resetHomeProductSlidersCache } from './home-product-sliders.cache.js'
import { homeProductSlidersService } from './home-product-sliders.service.js'
import { HOME_PRODUCT_SLIDER_KEYS } from './home-product-sliders.types.js'

config({ path: resolve(process.cwd(), '../.env') })

const integrationEnabled = isOdooConfigured() && isOdooCatalogConfigured()

describe.skipIf(!integrationEnabled)('home product sliders integration', () => {
  afterAll(() => {
    resetHomeProductSlidersCache()
  })

  it('restituisce slider con prodotti dal catalogo live', async () => {
    resetHomeProductSlidersCache()
    const sliders = await homeProductSlidersService.load(
      { correlationId: 'integration-home-sliders' },
      { locale: 'IT' },
    )

    expect(sliders.length).toBeGreaterThan(0)

    for (const slider of sliders) {
      expect(HOME_PRODUCT_SLIDER_KEYS).toContain(slider.key)
      expect(slider.products.length).toBeGreaterThan(0)

      for (const product of slider.products) {
        expect(product.slug).toBeTruthy()
        expect(product.name).toBeTruthy()
        expect(typeof product.priceCents).toBe('number')
        expect(product.currency).toBeTruthy()
      }
    }

    const keys = new Set(sliders.map((s) => s.key))
    expect(keys.has('top-technical') || keys.has('top-design') || keys.has('room-soggiorno')).toBe(
      true,
    )
  }, 120_000)

  it('mette in cache il risultato per 48h', async () => {
    resetHomeProductSlidersCache()
    const ctx = { correlationId: 'integration-home-sliders-cache' }

    const loadSpy = vi.spyOn(homeProductSlidersService, 'load')
    try {
      const first = await homeProductSlidersService.list(ctx, { locale: 'IT' })
      const second = await homeProductSlidersService.list(ctx, { locale: 'IT' })

      expect(first.length).toBeGreaterThan(0)
      expect(second).toEqual(first)
      expect(loadSpy).toHaveBeenCalledTimes(1)
    } finally {
      loadSpy.mockRestore()
    }
  }, 120_000)
})
