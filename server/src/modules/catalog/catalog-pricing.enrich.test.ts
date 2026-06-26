import { describe, expect, it, vi } from 'vitest'
import { enrichProductDetailWithOdooPricing } from './catalog-pricing.enrich.js'
import type { ProductDetailDTO } from '../../types/dto.js'

vi.mock('./odooPricing.service.js', () => ({
  unitPriceCentsFromOdoo: vi.fn(async (_ctx, _ref, variantRef: string | null | undefined) => {
    if (variantRef === '1622') return 17213
    if (variantRef === '1623') return 18500
    return 17213
  }),
}))

vi.mock('../../config/env.js', () => ({
  env: { ODOO_ENABLED: true },
}))

vi.mock('../../adapters/odoo/odooClient.js', () => ({
  isOdooConfigured: () => true,
}))

const baseProduct: ProductDetailDTO = {
  id: 'p1',
  slug: 'test-product',
  name: 'Test',
  priceCents: 19672,
  currencyCode: 'EUR',
  imageUrl: null,
  categorySlug: null,
  brandSlug: null,
  inStock: true,
  longDescription: null,
  sku: null,
  images: [],
  variants: [
    { ref: '1622', name: 'Variant A', priceCents: 19672, inStock: true, odooVariantId: 1622 },
    { ref: '1623', name: 'Variant B', priceCents: 20000, inStock: true, odooVariantId: 1623 },
  ],
  seo: { title: 'Test', description: null },
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
