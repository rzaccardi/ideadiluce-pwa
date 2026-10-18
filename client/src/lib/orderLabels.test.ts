import { describe, expect, it } from 'vitest'
import {
  formatOrderRef,
  orderDisplayStatus,
  resolveAccountOrderNumber,
} from './orderLabels'

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

describe('orderDisplayStatus', () => {
  it('non marca come spedito un bonifico in attesa anche se delivery è pending', () => {
    expect(
      orderDisplayStatus({
        status: 'payment_pending',
        paymentStatus: 'pending',
        delivery: { status: 'pending' },
        shipment: { status: 'preparing' },
      }),
    ).toBe('payment_pending')
  })

  it('non promuove delivery.pending a shipped mentre è in preparazione', () => {
    expect(
      orderDisplayStatus({
        status: 'confirmed',
        paymentStatus: 'captured',
        delivery: { status: 'pending' },
        shipment: { status: 'preparing' },
      }),
    ).toBe('confirmed')
    expect(
      orderDisplayStatus({
        status: 'synced',
        paymentStatus: 'captured',
        delivery: { status: 'pending' },
        shipment: { status: 'preparing' },
      }),
    ).toBe('synced')
  })

  it('mostra shipped solo quando la spedizione è effettivamente spedita', () => {
    expect(
      orderDisplayStatus({
        status: 'confirmed',
        paymentStatus: 'captured',
        shipment: { status: 'shipped' },
        delivery: { status: 'pending' },
      }),
    ).toBe('shipped')
  })
})
