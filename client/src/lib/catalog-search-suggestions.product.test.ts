import { describe, expect, it } from 'vitest'
import { productToSearchSuggestion } from './catalog-search-suggestions'

describe('productToSearchSuggestion', () => {
  it('include metadati prodotto per rich hit', () => {
    const suggestion = productToSearchSuggestion({
      slug: 'faretto-gu10',
      name: 'Faretto GU10',
      shortDescription: 'Faretto orientabile',
      imageUrl: 'https://cdn.example/img.jpg',
      priceCents: 1990,
      currency: 'EUR',
      specTags: ['GU10', '5W'],
    })

    expect(suggestion.kind).toBe('product')
    expect(suggestion.product?.imageUrl).toBe('https://cdn.example/img.jpg')
    expect(suggestion.product?.priceCents).toBe(1990)
    expect(suggestion.sublabel).toBe('Faretto orientabile')
  })
})
