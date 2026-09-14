import { describe, expect, it } from 'vitest'
import {
  buildCartAddHintFromCard,
  toServerCartAddHint,
} from './cart-add-hint'

describe('buildCartAddHintFromCard', () => {
  it('include il prezzo anche senza odooTemplateId', () => {
    const hint = buildCartAddHintFromCard({
      slug: 'lampada',
      name: 'Lampada',
      imageUrl: null,
      priceCents: 1990,
    })
    expect(hint?.unitPriceCents).toBe(1990)
    expect(hint?.odooTemplateId).toBeUndefined()
    expect(toServerCartAddHint(hint)).toBeUndefined()
  })

  it('invia l’hint al server solo con template Odoo', () => {
    const hint = buildCartAddHintFromCard({
      slug: 'lampada',
      name: 'Lampada',
      imageUrl: null,
      priceCents: 1990,
      odooTemplateId: 1997,
    })
    expect(hint?.odooTemplateId).toBe(1997)
    expect(toServerCartAddHint(hint)?.odooTemplateId).toBe(1997)
  })
})
