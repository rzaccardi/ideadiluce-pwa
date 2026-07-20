import { describe, expect, it } from 'vitest'
import { mapOdooCatalogProductDetail, mapOdooCatalogListItem } from './odooCatalogMapper.js'
import { withOdooCatalogImageSize, odooCatalogProductDocCurrentUrl } from './odooCatalogMedia.js'
import type { OdooCatalogProductDetail } from './odooCatalog.types.js'

const fixtureDetail: OdooCatalogProductDetail = {
  id: 6673,
  title: 'TUBO FLUORESCENTE T8 36 W G13 3350 lm 4000 K',
  slug: 'tubo-fluorescente-t8-36w-g13-4000k',
  short_description: 'Tubo fluorescente lineare T8 da 36 W',
  price_from: 4.9,
  price_to: 4.9,
  currency: 'EUR',
  image: { url: '/web/image/product.template/6673/image_512', alt: '' },
  description: '<p>Descrizione</p>',
  seo: {
    meta_title: 'Tubo Fluorescente',
    meta_description: 'Meta',
    og_image: { url: '/web/image/product.template/6673/image_1920', alt: '' },
  },
  gallery: [
    { type: 'image', tag: 'foto', url: '/web/image/product.template/6673/image_1920', alt: '' },
    { type: 'image', tag: 'attacco', url: '/web/image/product.image/512/image_1920', alt: 'Attacco G13' },
    {
      type: 'video',
      tag: 'applicazione',
      url: 'https://www.youtube.com/watch?v=abc123',
      alt: '',
    },
  ],
  specs: [
    {
      key: 'wattage',
      label: 'Potenza',
      unit: 'W',
      value_type: 'integer',
      cardinality: 'single',
      value: 36,
      display: '36 W',
    },
    {
      key: 'color_temperature_k',
      label: 'Temperatura colore',
      unit: 'K',
      value_type: 'integer',
      cardinality: 'discrete_set',
      value: { set: [3000, 4000, 6500] },
      display: '3000 / 4000 / 6500 K',
    },
    {
      key: 'power_range',
      label: 'Range potenza',
      unit: 'W',
      value_type: 'float',
      cardinality: 'continuous_range',
      value: { min: 20, max: 40 },
      display: '20–40 W',
    },
  ],
  variants: [
    {
      id: 9124,
      ced: '102261',
      manufacturer_code: '4050300517872',
      attributes: [{ attribute_id: 5, label: 'Colore luce', value: 'Bianco freddo' }],
      lst_price: 4.9,
      image: { url: '/web/image/product.product/9124/image_512', alt: '' },
      specs: [
        {
          key: 'wattage',
          label: 'Potenza',
          unit: 'W',
          value_type: 'integer',
          cardinality: 'single',
          value: 36,
          display: '36 W',
        },
      ],
    },
  ],
  documents: [
    {
      type: 'datasheet',
      name: 'DS_L36W840.pdf',
      mimetype: 'application/pdf',
      url: '/web/content/184223?download=true',
    },
  ],
}

describe('odooCatalogMedia', () => {
  it('sostituisce la size nell URL immagine', () => {
    const url = 'https://tlbdb.odoo.com/web/image/product.template/1/image_512'
    expect(withOdooCatalogImageSize(url, 'image_1920')).toBe(
      'https://tlbdb.odoo.com/web/image/product.template/1/image_1920',
    )
  })

  it('costruisce URL pubblico documenti', () => {
    expect(odooCatalogProductDocCurrentUrl('102261', 'datasheet')).toContain(
      '/product-docs/102261/datasheet/current',
    )
  })
})

describe('mapOdooCatalogProductDetail contratto v2', () => {
  it('mappa gallery tipizzata, specs, variante ced e documenti', () => {
    const dto = mapOdooCatalogProductDetail(fixtureDetail, 'IT')

    expect(dto.gallery?.length).toBe(3)
    expect(dto.gallery?.[0]).toMatchObject({ type: 'image', tag: 'foto' })
    expect(dto.gallery?.[2]).toMatchObject({
      type: 'video',
      tag: 'applicazione',
      url: 'https://www.youtube.com/watch?v=abc123',
    })

    expect(dto.specs?.find((s) => s.key === 'wattage')?.display).toBe('36 W')
    expect(dto.specs?.find((s) => s.cardinality === 'discrete_set')?.value).toEqual({
      set: [3000, 4000, 6500],
    })
    expect(dto.specs?.find((s) => s.cardinality === 'continuous_range')?.value).toEqual({
      min: 20,
      max: 40,
    })

    expect(dto.variants).toHaveLength(1)
    expect(dto.variants[0].ced).toBe('102261')
    expect(dto.variants[0].ref).toBe('9124')
    expect(dto.variants[0].specs?.[0]?.display).toBe('36 W')

    expect(dto.documents?.[0]?.type).toBe('datasheet')
    expect(dto.documents?.[0]?.mimetype).toBe('application/pdf')
    expect(dto.documents?.[0]?.publicCurrentUrl).toContain(
      '/product-docs/102261/datasheet/current',
    )
    expect(dto.defaultCode).toBeNull()
  })

  it('lista card usa image_512 e non dipende da default_code', () => {
    const card = mapOdooCatalogListItem(
      {
        ...fixtureDetail,
        default_code: 'LEGACY',
        ced: '102261',
        manufacturer_code: 'MPN',
      },
      'IT',
    )
    expect(card.imageUrl).toContain('image_512')
    expect(card.defaultCode).toBeNull()
    expect(card.sku).toBe('MPN')
  })
})
