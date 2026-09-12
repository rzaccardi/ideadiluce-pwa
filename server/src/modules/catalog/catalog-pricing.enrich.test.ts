import { describe, expect, it, vi } from 'vitest'
import {
  applySessionPricelistToOdooCatalogListItems,
  enrichProductCardsWithOdooPricing,
  enrichProductDetailWithOdooPricing,
} from './catalog-pricing.enrich.js'
import type { OdooCatalogProductListItem } from '../../adapters/odoo-catalog/odooCatalog.types.js'
import type { ProductDetailDTO } from '../../types/dto.js'

vi.mock('./odooPricing.service.js', () => ({
  unitPriceCentsFromOdoo: vi.fn(
    async (
      _ctx: unknown,
      _ref: string,
      variantRef: string | null | undefined,
      pricing?: { pricelistId?: number | null },
    ) => {
      if (pricing?.pricelistId === 44) return variantRef === '1623' ? 15000 : 14000
      if (pricing?.pricelistId === 31) return variantRef === '1623' ? 16500 : 15500
      if (variantRef === '1622') return 17213
      if (variantRef === '1623') return 18500
      return 17213
    },
  ),
  resolveCartLineUnitPricesCents: vi.fn(
    async (
      _ctx: unknown,
      lines: Array<{ lineId: string }>,
      pricing?: { pricelistId?: number | null },
    ) => {
      const unit =
        pricing?.pricelistId === 44 ? 8000 : pricing?.pricelistId === 31 ? 9200 : 19672
      const prices = new Map<string, number | null>()
      for (const line of lines) prices.set(line.lineId, unit)
      return prices
    },
  ),
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

  it('mostra il prezzo listino rivenditori, diverso da quello installatori', async () => {
    const ctx = { correlationId: 'test' }
    const b2b = await enrichProductDetailWithOdooPricing(ctx, baseProduct, {
      segment: 'BUSINESS',
      pricelistId: 44,
      partnerId: 99002,
      personalized: true,
    })
    const pro = await enrichProductDetailWithOdooPricing(ctx, baseProduct, {
      segment: 'PROFESSIONAL',
      pricelistId: 31,
      partnerId: 99003,
      personalized: true,
    })

    expect(b2b.priceCents).toBe(14000)
    expect(b2b.variants[0]?.priceCents).toBe(14000)
    expect(pro.priceCents).toBe(15500)
    expect(pro.variants[0]?.priceCents).toBe(15500)
    expect(b2b.priceCents).not.toBe(pro.priceCents)
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
      { slug: 'a', priceCents: 19672, odooTemplateId: 10 },
      { slug: 'b', priceCents: 19672, odooTemplateId: 11 },
    ]
    const next = await enrichProductCardsWithOdooPricing({ correlationId: 'test' }, cards, {
      segment: 'BUSINESS',
      pricelistId: 44,
      partnerId: 99002,
      personalized: true,
    })
    expect(next.map((c) => c.priceCents)).toEqual([8000, 8000])
  })

  it('applica il listino installatori sulle card listing', async () => {
    const cards = [{ slug: 'a', priceCents: 19672, odooTemplateId: 10 }]
    const next = await enrichProductCardsWithOdooPricing({ correlationId: 'test' }, cards, {
      segment: 'PROFESSIONAL',
      pricelistId: 31,
      partnerId: 99003,
      personalized: true,
    })
    expect(next[0]?.priceCents).toBe(9200)
  })
})

describe('applySessionPricelistToOdooCatalogListItems', () => {
  const listItem = {
    id: 10,
    title: 'A',
    slug: 'a',
    short_description: '',
    price_from: 196.72,
    price_to: 196.72,
    currency: 'EUR',
    image: { url: '', alt: '' },
  } as OdooCatalogProductListItem

  it('sovrascrive price_from/to col listino di sessione', async () => {
    const next = await applySessionPricelistToOdooCatalogListItems(
      { correlationId: 'test' },
      [listItem],
      { partner_id: '99002', pricelist_id: '44' },
    )
    expect(next[0]?.price_from).toBe(80)
    expect(next[0]?.price_to).toBe(80)
  })

  it('non tocca i prezzi se manca il listino di sessione', async () => {
    const next = await applySessionPricelistToOdooCatalogListItems(
      { correlationId: 'test' },
      [listItem],
      {},
    )
    expect(next[0]?.price_from).toBe(196.72)
  })
})
