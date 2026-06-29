import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { Request } from 'express'

const findOdooVariantByCode = vi.fn()
const fetchArflyProductDetail = vi.fn()
const fetchArflyProductList = vi.fn()
const resolvePricingContext = vi.fn()

vi.mock('../../adapters/odoo/odooProductCodeLookup.js', () => ({
  findOdooVariantByCode: (...args: unknown[]) => findOdooVariantByCode(...args),
}))

vi.mock('../../adapters/arfly/arflyClient.js', () => ({
  isArflyConfigured: () => true,
  fetchArflyProductDetail: (...args: unknown[]) => fetchArflyProductDetail(...args),
  fetchArflyProductList: (...args: unknown[]) => fetchArflyProductList(...args),
}))

vi.mock('../pricing/pricelist.service.js', () => ({
  resolvePricingContext: (...args: unknown[]) => resolvePricingContext(...args),
}))

import { resolveProductCodes } from './catalog-code-resolver.service.js'

function mockReq() {
  return { correlationId: 'test', sessionRecord: { user: { id: 'u1', customerSegment: 'RETAIL' } } } as Request
}

describe('resolveProductCodes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resolvePricingContext.mockResolvedValue({ segment: 'RETAIL', partnerId: null, pricelistId: null })
  })

  it('risolve via Odoo barcode con arricchimento Arfly', async () => {
    findOdooVariantByCode.mockResolvedValueOnce({
      variantId: 1184,
      templateId: 1178,
      defaultCode: 'OSRA464749',
      barcode: '4050300464749',
      matchField: 'barcode',
    })

    fetchArflyProductDetail.mockResolvedValueOnce({
      product: {
        id: 1178,
        title: 'Lampada fluorescente OSRAM',
        slug: 'osram-t5',
        short_description: '',
        description: '',
        price_from: 8,
        price_to: 8,
        currency: 'EUR',
        image: { url: '/img.jpg', alt: '' },
        seo: { meta_title: '', meta_description: '', og_image: { url: '', alt: '' } },
        gallery: [],
        specs: [],
        variants: [
          {
            id: 1184,
            ced: '001520',
            manufacturer_code: '464749',
            attributes: [],
            lst_price: 8,
            image: { url: '', alt: '' },
            specs: [],
            ean: null,
          },
        ],
        documents: [],
      },
    })

    const result = await resolveProductCodes(mockReq(), [{ code: '4050300464749', quantity: 3 }])

    expect(result.matched).toHaveLength(1)
    expect(result.matched[0]).toMatchObject({
      code: '4050300464749',
      quantity: 3,
      productRef: '1178',
      variantRef: '1184',
      productName: 'Lampada fluorescente OSRAM',
      matchType: 'odoo_barcode',
    })
    expect(result.unmatched).toHaveLength(0)
  })

  it('fallback Arfly quando Odoo non trova il codice', async () => {
    findOdooVariantByCode.mockResolvedValueOnce(null)
    fetchArflyProductList.mockResolvedValueOnce({
      items: [{ id: 7369, title: 'SPL LED', slug: 'spl-led', short_description: '', price_from: 25, price_to: 25, currency: 'EUR', image: { url: '', alt: '' } }],
      page: 1,
      per_page: 15,
      total: 1,
      total_pages: 1,
    })
    fetchArflyProductDetail.mockResolvedValueOnce({
      product: {
        id: 7369,
        title: 'SPL LED NAV-T',
        slug: 'spl-led',
        short_description: '',
        description: '',
        price_from: 25,
        price_to: 25,
        currency: 'EUR',
        image: { url: '', alt: '' },
        seo: { meta_title: '', meta_description: '', og_image: { url: '', alt: '' } },
        gallery: [],
        specs: [],
        variants: [
          {
            id: 8484,
            ced: '002144',
            manufacturer_code: 'L392702127',
            attributes: [],
            lst_price: 25,
            image: { url: '', alt: '' },
            specs: [],
            ean: '8718739073586',
          },
        ],
        documents: [],
      },
    })

    const result = await resolveProductCodes(mockReq(), [{ code: 'L392702127', quantity: 1 }])

    expect(result.matched).toHaveLength(1)
    expect(result.matched[0]?.matchType).toBe('arfly_mpn')
    expect(result.matched[0]?.variantRef).toBe('8484')
  })

  it('segnala codici non riconosciuti', async () => {
    findOdooVariantByCode.mockResolvedValue(null)
    fetchArflyProductList.mockResolvedValue({ items: [], page: 1, per_page: 15, total: 0, total_pages: 1 })

    const result = await resolveProductCodes(mockReq(), [
      { code: '4050300464749', quantity: 1 },
      { code: '8711500411990', quantity: 1 },
    ])

    expect(result.matched).toHaveLength(0)
    expect(result.unmatched).toHaveLength(2)
  })
})
