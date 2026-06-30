import { describe, expect, it } from 'vitest'
import { buildSearchQueryFromProduct } from './odooTopPurchasedSearchHints.js'

describe('buildSearchQueryFromProduct', () => {
  it('usa il codice prodotto per articoli tecnici', () => {
    expect(buildSearchQueryFromProduct('Lampadina LED GU10 5W 2700K', 'TLB 322805')).toBe('TLB 322805')
  })

  it('usa il nome per prodotti design senza codice distintivo', () => {
    expect(buildSearchQueryFromProduct('Artemide Eclisse', null)).toBe('Artemide Eclisse')
  })

  it('non duplica il codice se già nel nome', () => {
    expect(buildSearchQueryFromProduct('TLB 322805 Lampadina', 'TLB 322805')).toBe('TLB 322805 Lampadina')
  })

  it('tronca query troppo lunghe', () => {
    const longName = 'A'.repeat(200)
    expect(buildSearchQueryFromProduct(longName, null)).toHaveLength(120)
  })
})
