import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  applySessionPricelistToOdooCatalogDetail,
  applySessionPricelistToOdooCatalogListItems,
  enrichProductDetailWithOdooPricing,
} from './catalog-pricing.enrich.js'
import type { OdooCatalogProductListItem } from '../../adapters/odoo-catalog/odooCatalog.types.js'
import type { ProductDetailDTO } from '../../types/dto.js'

const { fetchStorefrontPricesMock } = vi.hoisted(() => ({
  fetchStorefrontPricesMock: vi.fn(),
}))

vi.mock('../pricing/odoo-storefront-pricing.service.js', () => ({
  fetchStorefrontPrices: (...args: unknown[]) => fetchStorefrontPricesMock(...args),
}))

vi.mock('../pricing/pricelist.service.js', () => ({
  isPersonalizedPricing: (pricing?: { personalized?: boolean; partnerId?: number | null } | null) =>
    Boolean(pricing?.personalized || (pricing?.partnerId != null && pricing.partnerId > 0)),
}))

vi.mock('../../config/env.js', () => ({
  env: { ODOO_ENABLED: true },
}))

vi.mock('../../adapters/odoo-api/odooApiClient.js', () => ({
  isOdooApiV2Configured: () => true,
}))

vi.mock('../../lib/prisma.js', () => ({
  prisma: {},
}))

const baseProduct: ProductDetailDTO = {
  slug: 'test-product',
  locale: 'IT',
  name: 'Test',
  shortDescription: null,
  priceCents: 19672,
  priceDisplayMode: 'ex_vat',
  currency: 'EUR',
  imageUrl: null,
  categorySlug: null,
  inStock: true,
  longDescription: null,
  sku: null,
  images: [],
  variants: [
    {
      ref: '1622',
      label: 'Variant A',
      imageUrl: null,
      attributes: [],
      priceCents: 19672,
      inStock: true,
      odooVariantId: 1622,
    },
    {
      ref: '1623',
      label: 'Variant B',
      imageUrl: null,
      attributes: [],
      priceCents: 20000,
      inStock: true,
      odooVariantId: 1623,
    },
  ],
  seo: { metaTitle: 'Test', metaDescription: null, canonical: null, noindex: false },
  alternates: [],
}

describe('enrichProductDetailWithOdooPricing', () => {
  beforeEach(() => {
    fetchStorefrontPricesMock.mockReset()
    fetchStorefrontPricesMock.mockResolvedValue({
      rows: new Map([
        [
          1622,
          {
            productId: 1622,
            priceCents: 15400,
            listPriceCents: 17213,
            publicPriceCents: 15400,
            discountPct: 10.5,
            source: 'public',
          },
        ],
        [
          1623,
          {
            productId: 1623,
            priceCents: 18500,
            listPriceCents: 18500,
            publicPriceCents: 18500,
            discountPct: null,
            source: 'public',
          },
        ],
      ]),
      snapshotAt: '2026-10-12T00:00:00.000Z',
      fromCache: false,
    })
  })

  it('sovrascrive priceCents/listPrice/discount da GET /prices', async () => {
    const ctx = { correlationId: 'test' }
    const enriched = await enrichProductDetailWithOdooPricing(ctx, baseProduct, {
      segment: 'RETAIL',
      pricelistId: 1,
      partnerId: null,
    })
    expect(enriched.variants[0]?.priceCents).toBe(15400)
    expect(enriched.variants[0]?.listPriceCents).toBe(17213)
    expect(enriched.variants[0]?.discountPct).toBe(10.5)
    expect(enriched.variants[1]?.priceCents).toBe(18500)
    expect(enriched.priceCents).toBe(15400)
    expect(fetchStorefrontPricesMock).toHaveBeenCalledWith(
      expect.objectContaining({ productIds: [1622, 1623], customerId: null }),
    )
  })

  it('passa customer_id per listino personalizzato', async () => {
    fetchStorefrontPricesMock.mockResolvedValue({
      rows: new Map([
        [
          1622,
          {
            productId: 1622,
            priceCents: 14172,
            listPriceCents: 17213,
            publicPriceCents: 15400,
            discountPct: 17.7,
            source: 'customer',
          },
        ],
      ]),
      snapshotAt: '2026-10-12T00:00:00.000Z',
      fromCache: false,
    })
    const enriched = await enrichProductDetailWithOdooPricing(
      { correlationId: 'test' },
      baseProduct,
      { segment: 'BUSINESS', partnerId: 14245, pricelistId: 44, personalized: true },
    )
    expect(enriched.variants[0]?.priceCents).toBe(14172)
    expect(enriched.variants[0]?.priceSource).toBe('customer')
    expect(fetchStorefrontPricesMock).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 14245 }),
    )
  })
})

describe('applySessionPricelistToOdooCatalogListItems', () => {
  it('non altera listing (prezzi pubblici catalogo)', async () => {
    const items = [
      {
        id: 1,
        title: 'A',
        slug: 'a',
        short_description: '',
        price_from: 10,
        price_to: 10,
        currency: 'EUR',
        image: { url: '/x', alt: '' },
      },
    ] as OdooCatalogProductListItem[]
    const next = await applySessionPricelistToOdooCatalogListItems(
      { correlationId: 't' },
      items,
      { partner_id: '9', pricelist_id: '44' },
    )
    expect(next[0]?.price_from).toBe(10)
  })
})

describe('applySessionPricelistToOdooCatalogDetail', () => {
  beforeEach(() => {
    fetchStorefrontPricesMock.mockReset()
    fetchStorefrontPricesMock.mockResolvedValue({
      rows: new Map([
        [
          99,
          {
            productId: 99,
            priceCents: 15400,
            listPriceCents: 17213,
            publicPriceCents: 15400,
            discountPct: 10.5,
            source: 'public',
          },
        ],
      ]),
      snapshotAt: '2026-10-12T00:00:00.000Z',
      fromCache: false,
    })
  })

  it('applica /prices alle varianti dettaglio se customer_id presente', async () => {
    const data = await applySessionPricelistToOdooCatalogDetail(
      { correlationId: 't' },
      {
        website: { id: 2, name: 'PWA' },
        lang: 'it_IT',
        product: {
          id: 1099,
          title: 'Eclisse',
          slug: 'eclisse',
          short_description: '',
          price_from: 172.13,
          price_to: 172.13,
          currency: 'EUR',
          image: { url: '/x', alt: '' },
          description: '',
          seo: {
            meta_title: '',
            meta_description: '',
            og_image: { url: '/x', alt: '' },
          },
          gallery: [],
          specs: [],
          variants: [
            {
              id: 99,
              ced: '1',
              manufacturer_code: null,
              attributes: [],
              lst_price: 172.13,
              image: { url: '/x', alt: '' },
              specs: [],
            },
          ],
          documents: [],
        },
      },
      { partner_id: '14245' },
    )
    expect(data.product.variants[0]?.price).toBe(154)
    expect(data.product.variants[0]?.list_price).toBe(172.13)
    expect(data.product.variants[0]?.discount_pct).toBe(10.5)
    expect(data.product.price_from).toBe(154)
  })

  it('non chiama /prices senza customer (resta catalogo pubblico)', async () => {
    await applySessionPricelistToOdooCatalogDetail(
      { correlationId: 't' },
      {
        website: { id: 2, name: 'PWA' },
        lang: 'it_IT',
        product: {
          id: 1099,
          title: 'Eclisse',
          slug: 'eclisse',
          short_description: '',
          price_from: 154,
          price_to: 154,
          currency: 'EUR',
          image: { url: '/x', alt: '' },
          description: '',
          seo: {
            meta_title: '',
            meta_description: '',
            og_image: { url: '/x', alt: '' },
          },
          gallery: [],
          specs: [],
          variants: [
            {
              id: 99,
              ced: '1',
              manufacturer_code: null,
              attributes: [],
              price: 154,
              list_price: 172.13,
              lst_price: 172.13,
              image: { url: '/x', alt: '' },
              specs: [],
            },
          ],
          documents: [],
        },
      },
      {},
    )
    expect(fetchStorefrontPricesMock).not.toHaveBeenCalled()
  })
})
