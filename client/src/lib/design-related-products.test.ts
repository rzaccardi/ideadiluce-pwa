import { describe, expect, it } from 'vitest'
import type { ProductCardDTO, ProductDetailDTO } from '@/types/dto'
import {
  buildDesignRelatedSearches,
  catalogFilterSlugFromLabel,
  extractDesignRelatedFilters,
  pickDesignRelatedProducts,
} from './design-related-products'

function product(
  partial: Partial<ProductDetailDTO> & Pick<ProductDetailDTO, 'slug' | 'name'>,
): Pick<ProductDetailDTO, 'slug' | 'name' | 'categories' | 'categorySlug' | 'brand'> {
  return {
    slug: partial.slug,
    name: partial.name,
    categories: partial.categories,
    categorySlug: partial.categorySlug ?? null,
    brand: partial.brand,
  }
}

describe('catalogFilterSlugFromLabel', () => {
  it('normalizza accenti e spazi', () => {
    expect(catalogFilterSlugFromLabel('Contemporaneo')).toBe('contemporaneo')
    expect(catalogFilterSlugFromLabel('Soggiorno ')).toBe('soggiorno')
  })
})

describe('extractDesignRelatedFilters', () => {
  it('prende designer, tipologia da categoria e stile dalle specs', () => {
    const filters = extractDesignRelatedFilters(
      product({
        slug: 'tolomeo',
        name: 'Tolomeo',
        categories: [
          { slug: 'arredo', name: 'Arredo' },
          { slug: 'sospensione', name: 'Sospensione' },
        ],
        brand: { slug: 'artemide', name: 'Artemide' },
      }),
      [
        { label: 'Designer', value: 'Michele De Lucchi' },
        { label: 'Stile', value: 'Contemporaneo' },
        { label: 'Ambiente', value: 'Soggiorno' },
      ],
    )
    expect(filters).toEqual({
      designerName: 'Michele De Lucchi',
      tipologia: 'sospensione',
      stile: 'contemporaneo',
      ambiente: 'soggiorno',
      brand: 'artemide',
    })
  })

  it('inferisce la tipologia dal testo specs se manca la categoria foglia', () => {
    const filters = extractDesignRelatedFilters(
      product({ slug: 'x', name: 'X', categorySlug: 'arredo' }),
      [
        { label: 'Tipologia fonte luminosa', value: 'LED' },
        { label: 'Tipologia lampada', value: 'Lampada a piantana' },
      ],
    )
    expect(filters.tipologia).toBe('piantana')
    expect(filters.designerName).toBeNull()
  })

  it('ignora designer placeholder', () => {
    const filters = extractDesignRelatedFilters(
      product({ slug: 'x', name: 'X' }),
      [{ label: 'Designer', value: 'n/a' }],
    )
    expect(filters.designerName).toBeNull()
  })
})

describe('buildDesignRelatedSearches', () => {
  it('cerca prima il designer, poi i filtri del prodotto, poi tipologia allargata', () => {
    const searches = buildDesignRelatedSearches({
      designerName: 'Michele De Lucchi',
      tipologia: 'sospensione',
      stile: 'contemporaneo',
      ambiente: 'soggiorno',
      brand: 'artemide',
    })
    expect(searches.map((s) => s.kind)).toEqual(['designer', 'similar', 'similar'])
    expect(searches[0]?.params).toEqual({ world: 'design', q: 'Michele De Lucchi' })
    expect(searches[1]?.params).toEqual({
      world: 'design',
      category: 'arredo',
      tipologia: 'sospensione',
      stile: 'contemporaneo',
      ambiente: 'soggiorno',
    })
    expect(searches[2]?.params).toEqual({
      world: 'design',
      category: 'arredo',
      tipologia: 'sospensione',
    })
  })

  it('senza designer usa brand se mancano gli altri filtri', () => {
    const searches = buildDesignRelatedSearches({
      designerName: null,
      brand: 'artemide',
    })
    expect(searches).toHaveLength(1)
    expect(searches[0]).toMatchObject({
      kind: 'similar',
      params: { world: 'design', category: 'arredo', brand: 'artemide' },
    })
  })
})

describe('pickDesignRelatedProducts', () => {
  it('esclude il prodotto corrente e i duplicati', () => {
    const card = (slug: string, name: string): ProductCardDTO => ({
      slug,
      locale: 'IT',
      name,
      shortDescription: null,
      priceCents: 1,
      priceDisplayMode: 'ex_vat',
      currency: 'EUR',
      imageUrl: null,
      categorySlug: 'arredo',
    })
    const items = [card('attuale', 'A'), card('altro', 'B'), card('altro', 'B2')]
    expect(pickDesignRelatedProducts(items, 'attuale', 8).map((p) => p.slug)).toEqual(['altro'])
  })
})
