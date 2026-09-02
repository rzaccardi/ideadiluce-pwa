import { describe, expect, it } from 'vitest'
import type { ProductDetailDTO } from '../../types/dto.js'
import { DEFAULT_MERCHANT_CENTER_SETTINGS } from './merchant-center.settings.js'
import {
  collectMerchantFeedIssues,
  feedItemXml,
  merchantAvailability,
  offersForProduct,
  wrapMerchantFeedXml,
} from './merchant-feed.service.js'

const baseProduct: ProductDetailDTO = {
  slug: 'lampada-sospensione',
  locale: 'IT',
  name: 'Lampada a sospensione',
  shortDescription: 'Lampada in metallo.',
  longDescription: null,
  priceCents: 12900,
  priceDisplayMode: 'ex_vat',
  currency: 'EUR',
  imageUrl: 'https://cdn.example/main.jpg',
  categorySlug: 'sospensioni',
  sku: 'SKU-100',
  manufacturerCode: 'MPN-100',
  ean: '8001234567890',
  inStock: true,
  images: ['https://cdn.example/main.jpg', 'https://cdn.example/alt.jpg'],
  categories: [{ slug: 'sospensioni', name: 'Sospensioni' }],
  brand: { slug: 'flos', name: 'Flos' },
  variants: [],
  seo: { metaTitle: null, metaDescription: null, canonical: null, noindex: false },
  alternates: [],
}

describe('merchantAvailability', () => {
  it('usa backorder se esaurito ma ordinabile', () => {
    expect(
      merchantAvailability({
        ...baseProduct,
        inStock: false,
        availability: { qtyAvailable: 0, isOrderable: true },
      }),
    ).toBe('backorder')
  })

  it('usa out_of_stock se non ordinabile', () => {
    expect(merchantAvailability({ ...baseProduct, inStock: false })).toBe('out_of_stock')
  })
})

describe('offersForProduct', () => {
  it('emette una riga template di default', () => {
    const offers = offersForProduct(baseProduct, 'https://shop.ideadiluce.it', DEFAULT_MERCHANT_CENTER_SETTINGS)
    expect(offers).toHaveLength(1)
    expect(offers[0]?.id).toBe('SKU-100')
    expect(offers[0]?.itemGroupId).toBeNull()
  })

  it('espande le varianti con item_group_id', () => {
    const product: ProductDetailDTO = {
      ...baseProduct,
      variants: [
        {
          ref: 'v-nero',
          label: 'Nero',
          imageUrl: null,
          attributes: [],
          priceCents: 12900,
          inStock: true,
          ean: '8001234567890',
          ced: '100001',
        },
        {
          ref: 'v-bianco',
          label: 'Bianco',
          imageUrl: 'https://cdn.example/white.jpg',
          attributes: [],
          priceCents: 13900,
          inStock: false,
          ean: '8001234567891',
          ced: '100002',
          manufacturerCode: 'MPN-W',
        },
      ],
    }
    const offers = offersForProduct(product, 'https://shop.ideadiluce.it', {
      ...DEFAULT_MERCHANT_CENTER_SETTINGS,
      expandVariants: true,
    })
    expect(offers).toHaveLength(2)
    expect(offers[0]?.id).toBe('100001')
    expect(offers[1]?.id).toBe('100002')
    expect(offers[1]?.title).toBe('Lampada a sospensione — Bianco')
    expect(offers[1]?.priceCents).toBe(13900)
    expect(offers.every((o) => o.itemGroupId === 'SKU-100')).toBe(true)
  })
})

describe('feedItemXml', () => {
  it('include gtin e categoria Google', () => {
    const [offer] = offersForProduct(baseProduct, 'https://shop.ideadiluce.it', DEFAULT_MERCHANT_CENTER_SETTINGS)
    const xml = feedItemXml(offer!, DEFAULT_MERCHANT_CENTER_SETTINGS)
    expect(xml).toContain('<g:gtin>8001234567890</g:gtin>')
    expect(xml).toContain('<g:google_product_category>594</g:google_product_category>')
    expect(xml).toContain('<g:mpn>MPN-100</g:mpn>')
    expect(xml).not.toContain('identifier_exists')
  })

  it('segna identifier_exists=false senza EAN', () => {
    const [offer] = offersForProduct(
      { ...baseProduct, ean: null },
      'https://shop.ideadiluce.it',
      DEFAULT_MERCHANT_CENTER_SETTINGS,
    )
    const xml = feedItemXml(offer!, DEFAULT_MERCHANT_CENTER_SETTINGS)
    expect(xml).toContain('<g:identifier_exists>false</g:identifier_exists>')
    expect(xml).not.toContain('<g:gtin>')
  })

  it('include spedizione se configurata nel BO', () => {
    const settings = { ...DEFAULT_MERCHANT_CENTER_SETTINGS, shippingPriceCents: 990 }
    const [offer] = offersForProduct(baseProduct, 'https://shop.ideadiluce.it', settings)
    const xml = feedItemXml(offer!, settings)
    expect(xml).toContain('<g:country>IT</g:country>')
    expect(xml).toContain('<g:price>9.90 EUR</g:price>')
  })
})

describe('wrapMerchantFeedXml', () => {
  it('restituisce un canale vuoto senza item', () => {
    const xml = wrapMerchantFeedXml('https://shop.ideadiluce.it', [])
    expect(xml).toContain('<channel>')
    expect(xml).not.toContain('<item>')
  })
})

describe('collectMerchantFeedIssues', () => {
  it('segnala noindex, immagine e prezzo a zero', () => {
    const product: ProductDetailDTO = {
      ...baseProduct,
      name: '',
      priceCents: 0,
      images: [],
      imageUrl: null,
      ean: null,
      seo: { ...baseProduct.seo, noindex: true },
    }
    const [offer] = offersForProduct(product, 'https://shop.ideadiluce.it', DEFAULT_MERCHANT_CENTER_SETTINGS)
    expect(collectMerchantFeedIssues(product, offer!)).toEqual([
      'noindex',
      'missing_title',
      'missing_image',
      'zero_price',
      'missing_gtin',
    ])
  })
})
