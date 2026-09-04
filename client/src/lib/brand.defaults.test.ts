import { describe, expect, it } from 'vitest'
import {
  brandAreaBadges,
  mergeBrandCards,
  resolveBrandCategories,
} from './brand.defaults'

describe('resolveBrandCategories', () => {
  it('usa i mondi Odoo al posto del default tecnico', () => {
    expect(resolveBrandCategories({ worlds: ['design'] })).toEqual(['design'])
    expect(resolveBrandCategories({ worlds: ['technical'] })).toEqual(['tecnico'])
    expect(resolveBrandCategories({ worlds: ['design', 'technical'] })).toEqual(['design', 'tecnico'])
  })

  it('non marca TECNICO se Odoo non ha mondi e non c’è meta', () => {
    expect(resolveBrandCategories({ worlds: [] })).toEqual([])
  })

  it('sovrascrive l’area di BRAND_META con i mondi Odoo e tiene i tag extra', () => {
    expect(
      resolveBrandCategories(
        { worlds: ['design'] },
        { categories: ['tecnico', 'lampadine'] },
      ),
    ).toEqual(['design', 'lampadine'])
  })
})

describe('brandAreaBadges', () => {
  it('mostra entrambe le marcatura se il brand è in arredo e tecnico', () => {
    expect(brandAreaBadges(['design', 'tecnico'])).toEqual([
      { area: 'design', label: 'ARREDO' },
      { area: 'technical', label: 'TECNICO' },
    ])
  })
})

describe('mergeBrandCards', () => {
  it('classifica i brand hub fuori da BRAND_META in base ai mondi Odoo', () => {
    const cards = mergeBrandCards([
      { slug: 'artemide', name: 'Artemide', productCount: 10, worlds: ['design'] },
      { slug: 'osram', name: 'OSRAM', productCount: 8, worlds: ['technical'] },
    ])
    expect(cards.find((c) => c.slug === 'artemide')?.categories).toEqual(['design'])
    expect(cards.find((c) => c.slug === 'osram')?.categories).toContain('tecnico')
    expect(cards.find((c) => c.slug === 'osram')?.categories).not.toContain('design')
  })
})
