import { describe, expect, it } from 'vitest'
import { formatDisplayOrderNumber } from './order-display-number.js'

describe('formatDisplayOrderNumber', () => {
  it('usa il codice Odoo assegnato', () => {
    expect(
      formatDisplayOrderNumber({
        id: 'ord-1',
        odooSaleOrderId: 88,
        odooSaleOrderName: '4CSVKG',
      }),
    ).toBe('4CSVKG')
  })

  it('usa l’id pubblico a 6 caratteri se il nome manca', () => {
    expect(formatDisplayOrderNumber({ id: '4CSVKG', odooSaleOrderId: 88 })).toBe('4CSVKG')
  })

  it('non usa l’ID interno Odoo come numero ordine', () => {
    expect(
      formatDisplayOrderNumber({
        id: 'ord-1',
        odooSaleOrderId: 88,
        odooSaleOrderName: null,
        createdAt: '2026-03-01T00:00:00.000Z',
      }),
    ).toBe('#IDL-2026-00088')
  })
})
