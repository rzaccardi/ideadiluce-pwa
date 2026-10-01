import { describe, expect, it } from 'vitest'
import {
  parseCategoryLandingFilters,
  resolveCategoryLandingSpecFilters,
  serializeCategoryLandingFilters,
  toggleCategoryLandingFilter,
} from './category-landing-filters'

describe('parseCategoryLandingFilters / serializeCategoryLandingFilters', () => {
  it('parse e serializza in modo stabile', () => {
    const selected = parseCategoryLandingFilters(new URLSearchParams('f=brand-osram,attacco-gu10'))
    expect(selected.has('brand-osram')).toBe(true)
    expect(selected.has('attacco-gu10')).toBe(true)
    expect(serializeCategoryLandingFilters(selected)).toBe('attacco-gu10,brand-osram')
  })

  it('ignora f vuoto', () => {
    expect(parseCategoryLandingFilters(new URLSearchParams('')).size).toBe(0)
    expect(serializeCategoryLandingFilters(new Set())).toBeNull()
  })
})

describe('toggleCategoryLandingFilter', () => {
  it('è esclusivo per attacco / brand / prezzo / tipologia', () => {
    let selected = new Set<string>(['attacco-e27'])
    selected = toggleCategoryLandingFilter(selected, 'attacco-gu10')
    expect([...selected]).toEqual(['attacco-gu10'])

    selected = toggleCategoryLandingFilter(selected, 'brand-osram')
    selected = toggleCategoryLandingFilter(selected, 'brand-philips')
    expect(selected.has('brand-osram')).toBe(false)
    expect(selected.has('brand-philips')).toBe(true)

    selected = toggleCategoryLandingFilter(selected, 'tipologia-tavolo')
    selected = toggleCategoryLandingFilter(selected, 'tipologia-soffitto')
    expect(selected.has('tipologia-tavolo')).toBe(false)
    expect(selected.has('tipologia-soffitto')).toBe(true)
  })

  it('permette più tag in AND', () => {
    let selected = new Set<string>()
    selected = toggleCategoryLandingFilter(selected, 'tag-dimmerabile')
    selected = toggleCategoryLandingFilter(selected, 'tag-ip65')
    expect(selected.has('tag-dimmerabile')).toBe(true)
    expect(selected.has('tag-ip65')).toBe(true)
  })

  it('toglie il valore se già selezionato', () => {
    const selected = toggleCategoryLandingFilter(new Set(['attacco-gu10']), 'attacco-gu10')
    expect(selected.size).toBe(0)
  })
})

describe('resolveCategoryLandingSpecFilters', () => {
  it('mappa attacco/kelvin/tipologia dai value landing', () => {
    const selected = new Set(['attacco-gu10', 'kelvin-3000k', 'tipologia-tavolo', 'tag-dimmerabile'])
    expect(resolveCategoryLandingSpecFilters(selected)).toEqual({
      attacco: 'GU10',
      colorTemp: '3000K',
      wattaggio: undefined,
      categorySlugFromFacet: undefined,
      tipologia: 'tavolo',
      ambiente: undefined,
      stile: undefined,
      tag: 'dimmerabile',
    })
  })

  it('preferisce i param URL strutturati quando presenti', () => {
    const params = new URLSearchParams('attacco=E27&tipologia=soffitto')
    expect(
      resolveCategoryLandingSpecFilters(new Set(['attacco-gu10', 'tipologia-tavolo']), params),
    ).toMatchObject({
      attacco: 'E27',
      tipologia: 'soffitto',
    })
  })
})
