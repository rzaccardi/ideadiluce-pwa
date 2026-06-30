import { describe, expect, it } from 'vitest'
import {
  extraHomeProductSliders,
  productsFromHomeSlider,
  resolveShowcaseProducts,
} from './home-product-sliders'
import type { HomeProductSliderDTO } from '@/types/home-product-sliders'

const card = { slug: 'a', locale: 'IT', name: 'A', priceCents: 100, currency: 'EUR' } as const

const sliders: HomeProductSliderDTO[] = [
  { key: 'top-design', products: [{ ...card, slug: 'design-1' }] },
  { key: 'top-technical', products: [{ ...card, slug: 'tech-1' }] },
  { key: 'in-stock', products: [{ ...card, slug: 'stock-1' }] },
  { key: 'room-soggiorno', products: [{ ...card, slug: 'room-1' }] },
]

describe('home-product-sliders helpers', () => {
  it('estrae prodotti per chiave slider', () => {
    expect(productsFromHomeSlider(sliders, 'top-design')[0]?.slug).toBe('design-1')
  })

  it('restituisce solo lo slider extra in-stock', () => {
    expect(extraHomeProductSliders(sliders).map((s) => s.key)).toEqual(['in-stock'])
  })

  it('usa il fallback query quando lo slider è vuoto', () => {
    expect(
      resolveShowcaseProducts([], 'top-design', [{ ...card, slug: 'fallback' }], 12)[0]?.slug,
    ).toBe('fallback')
  })

  it('limita a 12 prodotti per slider', () => {
    const many = Array.from({ length: 20 }, (_, i) => ({ ...card, slug: `p-${i}` }))
    expect(resolveShowcaseProducts([{ key: 'top-design', products: many }], 'top-design', [], 12)).toHaveLength(12)
  })
})
