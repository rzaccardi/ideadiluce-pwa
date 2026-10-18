import { describe, expect, it } from 'vitest'
import { customerFacingOrderRef } from './customer-facing-order-ref.js'

describe('customerFacingOrderRef', () => {
  it('restituisce il riferimento cliente compilato', () => {
    expect(customerFacingOrderRef('PO-12345')).toBe('PO-12345')
    expect(customerFacingOrderRef('  cantiere nord  ')).toBe('cantiere nord')
  })

  it('nasconde fallback tecnici PWA/Odoo', () => {
    expect(customerFacingOrderRef(null)).toBeNull()
    expect(customerFacingOrderRef('')).toBeNull()
    expect(customerFacingOrderRef('PWA cmvcmdqt900pxb3011q9jtf7a')).toBeNull()
    expect(customerFacingOrderRef('pwa-cmvcmdqt900pxb3011q9jtf7a')).toBeNull()
    expect(customerFacingOrderRef('PWA-QUOTE-ABCD1234')).toBeNull()
    expect(customerFacingOrderRef('ODOO-QUOTE-99')).toBeNull()
  })
})
