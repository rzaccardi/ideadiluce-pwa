import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ProductDetailDTO } from '../../types/dto.js'

const odooExecuteKw = vi.fn()
const getCachedProductDetailById = vi.fn()
const envState = { ODOO_ENABLED: true }

vi.mock('../../config/env.js', () => ({
  env: envState,
}))

vi.mock('../../adapters/odoo/odooClient.js', () => ({
  isOdooConfigured: () => true,
  odooExecuteKw: (...args: unknown[]) => odooExecuteKw(...args),
}))

vi.mock('./odoo-catalog-index.service.js', () => ({
  getCachedProductDetailById: (...args: unknown[]) => getCachedProductDetailById(...args),
}))

vi.mock('../../adapters/odoo-catalog/odooCatalogMapper.js', () => ({
  mapOdooCatalogListItem: (product: { id: number; slug: string; title: string; price_from: number }) => ({
    slug: product.slug,
    locale: 'IT',
    name: product.title,
    shortDescription: null,
    priceCents: Math.round(product.price_from * 100),
    priceDisplayMode: 'ex_vat',
    currency: 'EUR',
    imageUrl: null,
    categorySlug: null,
    odooTemplateId: product.id,
  }),
}))

const { enrichProductDetailWithAccessories } = await import('./catalog-accessories.enrich.js')

const baseProduct: ProductDetailDTO = {
  slug: 'lampada-tavolo',
  locale: 'IT',
  name: 'Lampada da tavolo',
  shortDescription: null,
  longDescription: null,
  priceCents: 18900,
  priceDisplayMode: 'ex_vat',
  currency: 'EUR',
  imageUrl: null,
  categorySlug: 'tavolo',
  sku: null,
  inStock: true,
  images: [],
  variants: [],
  seo: { metaTitle: null, metaDescription: null, canonical: null, noindex: false },
  alternates: [],
  odooTemplateId: 100,
}

describe('enrichProductDetailWithAccessories', () => {
  beforeEach(() => {
    odooExecuteKw.mockReset()
    getCachedProductDetailById.mockReset()
    envState.ODOO_ENABLED = true
  })

  it('lascia gli accessori già presenti e ripara odooTemplateId da URL immagine', async () => {
    const product: ProductDetailDTO = {
      ...baseProduct,
      accessories: [
        {
          slug: 'lampadina-e27',
          locale: 'IT',
          name: 'Lampadina E27',
          shortDescription: null,
          priceCents: 890,
          priceDisplayMode: 'ex_vat',
          currency: 'EUR',
          imageUrl: '/web/image/product.template/55/image_512',
          categorySlug: null,
          relation: 'accessory',
        },
      ],
    }

    const enriched = await enrichProductDetailWithAccessories({ correlationId: 'test' }, product)
    expect(odooExecuteKw).not.toHaveBeenCalled()
    expect(enriched.accessories?.[0]?.odooTemplateId).toBe(55)
  })

  it('se il catalogo non ha accessori, li risolve da optional/accessory Odoo', async () => {
    odooExecuteKw.mockResolvedValueOnce([
      { id: 100, optional_product_ids: [55], accessory_product_ids: [55, 66] },
    ])
    getCachedProductDetailById.mockImplementation(async (_locale: string, id: number) => {
      if (id === 55) {
        return { product: { id: 55, slug: 'lampadina-e27', title: 'Lampadina E27', price_from: 8.9 } }
      }
      if (id === 66) {
        return { product: { id: 66, slug: 'dimmer', title: 'Dimmer', price_from: 24 } }
      }
      return null
    })

    const enriched = await enrichProductDetailWithAccessories({ correlationId: 'test' }, baseProduct)
    expect(enriched.accessories).toHaveLength(2)
    expect(enriched.accessories?.map((a) => a.slug)).toEqual(['lampadina-e27', 'dimmer'])
    expect(enriched.accessories?.[0]?.relation).toBe('accessory')
    expect(enriched.accessories?.[0]?.odooTemplateId).toBe(55)
  })

  it('non inventa accessori se Odoo non restituisce id o il catalogo non li risolve', async () => {
    odooExecuteKw.mockResolvedValueOnce([{ id: 100, optional_product_ids: [], accessory_product_ids: [] }])
    const empty = await enrichProductDetailWithAccessories({ correlationId: 'test' }, baseProduct)
    expect(empty.accessories).toBeUndefined()

    odooExecuteKw.mockResolvedValueOnce([{ id: 100, optional_product_ids: [99], accessory_product_ids: [] }])
    getCachedProductDetailById.mockResolvedValueOnce(null)
    const unresolved = await enrichProductDetailWithAccessories({ correlationId: 'test' }, baseProduct)
    expect(unresolved.accessories).toBeUndefined()
  })
})
