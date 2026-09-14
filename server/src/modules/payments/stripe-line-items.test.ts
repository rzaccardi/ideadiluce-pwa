import { describe, expect, it } from 'vitest'
import {
  alignStripeLineItems,
  stripeAmountsMatch,
  sumStripeLineItems,
} from './stripe-line-items.js'

const eur = 'EUR'

function line(name: string, amountCents: number, quantity = 1) {
  return { name, amountCents, quantity, currencyCode: eur }
}

describe('alignStripeLineItems', () => {
  it('aggiunge l’IVA quando le righe sono al netto', () => {
    const aligned = alignStripeLineItems({
      lines: [line('Lampada', 164), line('Portalampade', 49), line('Spedizione', 590)],
      amountCents: 850,
      currencyCode: eur,
      taxLabel: 'IVA 22%',
    })
    expect(sumStripeLineItems(aligned)).toBe(850)
    expect(aligned.at(-1)).toMatchObject({ name: 'IVA 22%', amountCents: 47, quantity: 1 })
  })

  it('non duplica l’imposta se il totale già coincide', () => {
    const lines = [line('Prodotto', 100), line('IVA', 22)]
    const aligned = alignStripeLineItems({
      lines,
      amountCents: 122,
      currencyCode: eur,
    })
    expect(aligned).toEqual(lines)
  })

  it('usa una riga unica se le line item superano il totale ordine', () => {
    const aligned = alignStripeLineItems({
      lines: [line('Prodotto', 900)],
      amountCents: 850,
      currencyCode: eur,
    })
    expect(aligned).toEqual([line('Ordine', 850)])
  })

  it('addebita il totale ordine se non ci sono righe', () => {
    const aligned = alignStripeLineItems({
      lines: [],
      amountCents: 850,
      currencyCode: eur,
    })
    expect(sumStripeLineItems(aligned)).toBe(850)
    expect(aligned).toHaveLength(1)
  })
})

describe('stripeAmountsMatch', () => {
  it('tollera 2 centesimi come il finalize', () => {
    expect(stripeAmountsMatch(850, 850)).toBe(true)
    expect(stripeAmountsMatch(850, 848)).toBe(true)
    expect(stripeAmountsMatch(850, 803)).toBe(false)
  })
})
