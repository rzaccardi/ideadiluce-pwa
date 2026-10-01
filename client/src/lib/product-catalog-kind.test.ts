import { describe, expect, it } from 'vitest'
import type { ProductCardDTO, ProductDetailDTO } from '@/types/dto'
import {
  resolveProductCardCatalogKind,
  resolveProductCatalogKind,
  resolveProductCatalogKindFromSlug,
} from './product-catalog-kind'

function card(partial: Partial<ProductCardDTO> & Pick<ProductCardDTO, 'slug' | 'name'>): ProductCardDTO {
  return {
    slug: partial.slug,
    locale: partial.locale ?? 'IT',
    name: partial.name,
    shortDescription: partial.shortDescription ?? null,
    specTags: partial.specTags,
    priceCents: partial.priceCents ?? 1000,
    priceDisplayMode: partial.priceDisplayMode ?? 'ex_vat',
    currency: partial.currency ?? 'EUR',
    imageUrl: partial.imageUrl ?? null,
    categorySlug: partial.categorySlug ?? null,
    brand: partial.brand,
  }
}

describe('resolveProductCardCatalogKind', () => {
  it('non tratta specTags o attacco E27 come segnale tecnico (card arredo senza Aggiungi)', () => {
    expect(
      resolveProductCardCatalogKind(
        card({
          slug: 'tolomeo',
          name: 'Tolomeo Tavolo',
          shortDescription: 'Lampada da tavolo E27 100W',
          specTags: ['E27', '100W', 'IP20'],
          categorySlug: 'tavolo',
        }),
      ),
    ).toBe('design')
  })

  it('riconosce arredo dalla categoria root', () => {
    expect(
      resolveProductCardCatalogKind(
        card({ slug: 'x', name: 'X', categorySlug: 'arredo', specTags: ['E27'] }),
      ),
    ).toBe('design')
  })

  it('riconosce tecnica dalla categoria', () => {
    expect(
      resolveProductCardCatalogKind(
        card({ slug: 'y', name: 'Y', categorySlug: 'illuminazione-tecnica' }),
      ),
    ).toBe('technical')
  })

  it('classifica lampadine/driver dal nome anche senza categoria tecnica', () => {
    expect(
      resolveProductCardCatalogKind(
        card({ slug: 'l1', name: 'Lampadina LED GU10 5W', categorySlug: null }),
      ),
    ).toBe('technical')
    expect(
      resolveProductCardCatalogKind(
        card({ slug: 'd1', name: 'Driver LED 350mA', categorySlug: 'led' }),
      ),
    ).toBe('technical')
  })

  it('rispetta override slug di test', () => {
    expect(
      resolveProductCardCatalogKind(
        card({
          slug: 'lampada-fluorescente-lineare-t5-35w-840-osram-lumilux',
          name: 'Osram',
          categorySlug: null,
        }),
      ),
    ).toBe('technical')
  })
})

describe('resolveProductCatalogKind', () => {
  it('preferisce design se le categorie includono arredo anche con specTags', () => {
    const product = {
      ...card({
        slug: 'eclisse',
        name: 'Eclisse',
        categorySlug: 'tavolo',
        specTags: ['E14', '40W'],
      }),
      categories: [
        { slug: 'tavolo', name: 'Tavolo' },
        { slug: 'arredo', name: 'Arredo' },
      ],
      images: [],
      descriptionHtml: null,
      variants: [],
      relatedProducts: [],
      accessories: [],
      alternatives: [],
    } as ProductDetailDTO

    expect(resolveProductCatalogKind(product)).toBe('design')
  })
})

describe('resolveProductCatalogKindFromSlug', () => {
  it('stima tecnica da slug lampadina', () => {
    expect(resolveProductCatalogKindFromSlug('lampadina-led-gu10-5w')).toBe('technical')
  })

  it('default design per slug neutri', () => {
    expect(resolveProductCatalogKindFromSlug('tolomeo-tavolo-artemide')).toBe('design')
  })
})
