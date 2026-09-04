import { describe, expect, it, vi } from 'vitest'
import {
  enrichProductCardsWithOdooPricing,
  enrichProductDetailWithOdooPricing,
} from './catalog-pricing.enrich.js'
import type { ProductDetailDTO } from '../../types/dto.js'

vi.mock('./odooPricing.service.js', () => ({
  unitPriceCentsFromOdoo: vi.fn(async (_ctx, _ref, variantRef: string | null | undefined) => {
    if (variantRef === '1622') return 17213
    if (variantRef === '1623') return 18500
    return 17213
  }),
  resolveCartLineUnitPricesCents: vi.fn(async (_ctx, lines: Array<{ lineId: string }>) => {
    const prices = new Map<string, number | null>()
    for (const line of lines) prices.set(line.lineId, 8800)
    return prices
  }),
}))

vi.mock('../../config/env.js', () => ({
  env: { ODOO_ENABLED: true },
}))

vi.mock('../../adapters/odoo/odooClient.js', () => ({
  isOdooConfigured: () => true,
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
  it('sovrascrive priceCents varianti con prezzo Odoo', async () => {
    const ctx = { correlationId: 'test' }
    const enriched = await enrichProductDetailWithOdooPricing(ctx, baseProduct, {
      segment: 'RETAIL',
      pricelistId: 1,
      partnerId: null,
    })
    expect(enriched.variants[0]?.priceCents).toBe(17213)
    expect(enriched.variants[1]?.priceCents).toBe(18500)
    expect(enriched.priceCents).toBe(17213)
    expect(enriched.priceLabel).toBe('excl_vat')
  })
})

describe('enrichProductCardsWithOdooPricing', () => {
  it('non tocca i prezzi pubblici se la sessione non è personalizzata', async () => {
    const cards = [
      { slug: 'a', priceCents: 490, odooTemplateId: 10 },
      { slug: 'b', priceCents: 990, odooTemplateId: 11 },
    ]
    const next = await enrichProductCardsWithOdooPricing({ correlationId: 'test' }, cards, {
      segment: 'RETAIL',
      pricelistId: 10,
      partnerId: null,
      personalized: false,
    })
    expect(next.map((c) => c.priceCents)).toEqual([490, 990])
  })

  it('applica il listino B2B in batch sulle card listing', async () => {
    const cards = [
      { slug: 'a', priceCents: 490, odooTemplateId: 10 },
      { slug: 'b', priceCents: 990, odooTemplateId: 11 },
    ]
    const next = await enrichProductCardsWithOdooPricing({ correlationId: 'test' }, cards, {
      segment: 'BUSINESS',
      pricelistId: 44,
      partnerId: 99002,
      personalized: true,
    })
    expect(next.map((c) => c.priceCents)).toEqual([8800, 8800])
  })
})
