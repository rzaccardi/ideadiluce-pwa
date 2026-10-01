import { describe, expect, it } from 'vitest'
import {
  cartLineIdentityMatch,
  findMergableCartLine,
  normalizeCartVariantRef,
  planCoalesceDuplicateCartLines,
} from './cart-line-identity.js'

describe('normalizeCartVariantRef', () => {
  it('normalizza VAR- legacy e stringhe vuote', () => {
    expect(normalizeCartVariantRef('VAR-88')).toBe('88')
    expect(normalizeCartVariantRef('88')).toBe('88')
    expect(normalizeCartVariantRef('')).toBeNull()
    expect(normalizeCartVariantRef(null)).toBeNull()
  })
})

describe('findMergableCartLine', () => {
  const items = [
    {
      id: 'a',
      productRef: '1997',
      variantRef: '88',
      quantity: 1,
      metadataJson: { productSlug: 'lampada' },
    },
    {
      id: 'b',
      productRef: '42',
      variantRef: null as string | null,
      quantity: 2,
      metadataJson: { productSlug: 'sedia' },
    },
  ]

  it('accorpa stesso template + stessa variante', () => {
    const found = findMergableCartLine(items, {
      productRef: '1997',
      variantRef: '88',
      productSlug: 'lampada',
    })
    expect(found?.id).toBe('a')
  })

  it('accorpa slug legacy vs template id tramite metadata', () => {
    const found = findMergableCartLine(items, {
      productRef: 'lampada',
      variantRef: '88',
      productSlug: 'lampada',
    })
    expect(found?.id).toBe('a')
  })

  it('accorpa VAR-88 con 88', () => {
    const found = findMergableCartLine(items, {
      productRef: '1997',
      variantRef: 'VAR-88',
      productSlug: 'lampada',
    })
    expect(found?.id).toBe('a')
  })

  it('accorpa add senza variante su riga con variante', () => {
    const found = findMergableCartLine(items, {
      productRef: '1997',
      variantRef: null,
      productSlug: 'lampada',
    })
    expect(found?.id).toBe('a')
  })

  it('accorpa add con variante su riga senza variante', () => {
    const found = findMergableCartLine(items, {
      productRef: '42',
      variantRef: '99',
      productSlug: 'sedia',
    })
    expect(found?.id).toBe('b')
  })

  it('non accorpa varianti diverse dello stesso prodotto', () => {
    const found = findMergableCartLine(items, {
      productRef: '1997',
      variantRef: '99',
      productSlug: 'lampada',
    })
    expect(found).toBeUndefined()
  })
})

describe('cartLineIdentityMatch', () => {
  it('riconosce slug productRef legacy senza metadata se entrambi usano lo stesso slug', () => {
    expect(
      cartLineIdentityMatch(
        { productRef: 'lampada', variantRef: null },
        { productRef: 'lampada', variantRef: '88', productSlug: 'lampada' },
      ),
    ).toBe(true)
  })
})

describe('planCoalesceDuplicateCartLines', () => {
  it('unisce duplicati 88 e VAR-88 sommando le quantità', () => {
    const plans = planCoalesceDuplicateCartLines([
      {
        id: '1',
        productRef: '1997',
        variantRef: '88',
        quantity: 1,
        metadataJson: { productSlug: 'lampada' },
      },
      {
        id: '2',
        productRef: 'lampada',
        variantRef: 'VAR-88',
        quantity: 2,
        metadataJson: { productSlug: 'lampada' },
      },
    ])
    expect(plans).toHaveLength(1)
    expect(plans[0]?.quantity).toBe(3)
    expect(plans[0]?.removeIds).toEqual(['2'])
    expect(plans[0]?.productRef).toBe('1997')
    expect(plans[0]?.variantRef).toBe('88')
  })
})
