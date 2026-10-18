import { describe, expect, it } from 'vitest'
import { checkoutLinesFingerprint } from './odooOrderApi.js'

describe('checkoutLinesFingerprint', () => {
  it('cambia quando cambia la spedizione', () => {
    const lines = [{ product_id: 1, qty: 1 }]
    const a = checkoutLinesFingerprint(lines, { carrier: 'economy', amount_net: 8.07 })
    const b = checkoutLinesFingerprint(lines, { carrier: 'dhl', amount_net: 11.42 })
    expect(a).not.toBe(b)
  })

  it('cambia quando cambia il carrello', () => {
    const ship = { carrier: 'economy', amount_net: 8.07 }
    const a = checkoutLinesFingerprint([{ product_id: 1, qty: 1 }], ship)
    const b = checkoutLinesFingerprint(
      [
        { product_id: 1, qty: 1 },
        { product_id: 2, qty: 1 },
      ],
      ship,
    )
    expect(a).not.toBe(b)
  })

  it('è stabile a parità di contenuto', () => {
    const lines = [{ product_id: 10, qty: 2, price_unit_net: 1.5 }]
    const ship = { carrier: 'economy', amount_net: 8.07 }
    expect(checkoutLinesFingerprint(lines, ship)).toBe(checkoutLinesFingerprint(lines, ship))
  })
})
