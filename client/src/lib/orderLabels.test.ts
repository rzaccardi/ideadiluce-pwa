import { describe, expect, it } from 'vitest'
import { formatOrderRef, resolveAccountOrderNumber } from './orderLabels'

describe('resolveAccountOrderNumber', () => {
  it('usa il numero ordine assegnato, non l’ID interno', () => {
    expect(
      resolveAccountOrderNumber({
        id: 'pwa-ord-1',
        odooSaleOrderId: 88,
        orderNumber: '4CSVKG',
      }),
    ).toBe('4CSVKG')
  })

  it('accetta l’id pubblico a 6 caratteri come fallback', () => {
    expect(resolveAccountOrderNumber({ id: '4CSVKG', odooSaleOrderId: 88 })).toBe('4CSVKG')
  })
})

describe('formatOrderRef', () => {
  it('mostra il codice assegnato in area account', () => {
    expect(
      formatOrderRef({ id: 'pwa-ord-1', odooSaleOrderId: 88, orderNumber: '4CSVKG' }, 'IT'),
    ).toBe('Ordine 4CSVKG')
  })
})
