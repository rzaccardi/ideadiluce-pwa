import { describe, expect, it } from 'vitest'
import type { ProductCardDTO } from '@/types/dto'
import {
  productCardObjectFitClass,
  productCatalogObjectFitClass,
  productGalleryObjectFitClass,
  productSearchThumbObjectFitClass,
} from './product-image-fit'

function card(partial: Partial<ProductCardDTO> & Pick<ProductCardDTO, 'slug' | 'name'>): ProductCardDTO {
  return {
    locale: 'IT',
    shortDescription: null,
    priceCents: 1230,
    priceDisplayMode: 'ex_vat',
    currency: 'EUR',
    imageUrl: null,
    categorySlug: null,
    ...partial,
  }
}

describe('productGalleryObjectFitClass', () => {
  it('usa contain per packshot e tag interni', () => {
    expect(productGalleryObjectFitClass('foto')).toBe('object-contain')
    expect(productGalleryObjectFitClass('dettaglio')).toBe('object-contain')
    expect(productGalleryObjectFitClass('attacco')).toBe('object-contain')
    expect(productGalleryObjectFitClass(undefined)).toBe('object-contain')
  })

  it('usa cover solo per le foto ambiente', () => {
    expect(productGalleryObjectFitClass('ambiente')).toBe('object-cover')
  })
})

describe('productCatalogObjectFitClass', () => {
  it('usa contain nel catalogo tecnico e cover in arredo', () => {
    expect(productCatalogObjectFitClass('technical')).toBe('object-contain')
    expect(productCatalogObjectFitClass('design')).toBe('object-cover')
  })
})

describe('productCardObjectFitClass', () => {
  it('usa contain sui ricambi tecnici con foto non da cover', () => {
    expect(
      productCardObjectFitClass(
        card({
          slug: 'driver-led-21w-150-500ma-vossloh',
          name: 'Driver LED 21W 150-500mA Vossloh-Schwabe IP20',
          categorySlug: 'illuminazione-tecnica',
          specTags: ['21W', 'IP20'],
        }),
      ),
    ).toBe('object-contain')
  })

  it('usa cover sulle lampade d’arredo', () => {
    expect(
      productCardObjectFitClass(
        card({
          slug: 'eclisse-lampada-da-tavolo-artemide',
          name: 'Eclisse lampada da tavolo Artemide',
          categorySlug: 'arredo',
        }),
      ),
    ).toBe('object-cover')
  })
})

describe('productSearchThumbObjectFitClass', () => {
  it('usa contain se ci sono spec tag tecnici o il nome è un componente', () => {
    expect(productSearchThumbObjectFitClass({ specTags: ['21W'] })).toBe('object-contain')
    expect(productSearchThumbObjectFitClass({ label: 'Driver LED 21W Vossloh' })).toBe('object-contain')
    expect(productSearchThumbObjectFitClass({ label: 'Eclisse Artemide' })).toBe('object-cover')
  })
})
