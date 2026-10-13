import { describe, expect, it } from 'vitest'
import { mapOdooCatalogListItem, mapOdooCatalogProductDetail } from './mapper'
import type { OdooCatalogProductDetail, OdooCatalogProductListItem } from './types'

describe('odoo-catalog mapper pricing promo', () => {
  it('mappa listing con list_price_from e discount_pct_max', () => {
    const item: OdooCatalogProductListItem = {
      id: 1099,
      title: 'Eclisse',
      slug: 'eclisse',
      short_description: '',
      price_from: 154,
      price_to: 154,
      list_price_from: 172.13,
      list_price_to: 172.13,
      discount_pct_max: 10.5,
      currency: 'EUR',
      image: { url: '/x', alt: '' },
    }
    const dto = mapOdooCatalogListItem(item, 'IT')
    expect(dto.priceCents).toBe(15400)
    expect(dto.listPriceCents).toBe(17213)
    expect(dto.discountPct).toBe(10.5)
  })

  it('mappa variante price/list_price/discount e fallback lst_price', () => {
    const product: OdooCatalogProductDetail = {
      id: 1,
      title: 'X',
      slug: 'x',
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
      documents: [],
      variants: [
        {
          id: 99,
          ced: '1',
          manufacturer_code: null,
          attributes: [],
          price: 154,
          list_price: 172.13,
          discount_pct: 10.5,
          lst_price: 172.13,
          image: { url: '/x', alt: '' },
          specs: [],
        },
        {
          id: 2316,
          ced: '2',
          manufacturer_code: null,
          attributes: [],
          price: 1131.15,
          list_price: 1131.15,
          lst_price: 1131.15,
          image: { url: '/x', alt: '' },
          specs: [],
        },
      ],
    }
    const dto = mapOdooCatalogProductDetail(product, 'IT')
    expect(dto.variants[0]?.priceCents).toBe(15400)
    expect(dto.variants[0]?.listPriceCents).toBe(17213)
    expect(dto.variants[0]?.discountPct).toBe(10.5)
    expect(dto.variants[1]?.priceCents).toBe(113115)
    expect(dto.variants[1]?.listPriceCents).toBe(113115)
  })
})
