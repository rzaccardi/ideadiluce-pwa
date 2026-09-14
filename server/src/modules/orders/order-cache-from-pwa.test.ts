import { describe, expect, it } from 'vitest'
import { orderCacheFieldsForPwaOrder } from './order-cache-from-pwa.js'

describe('orderCacheFieldsForPwaOrder', () => {
  it('non marca come pagato un bonifico in attesa', () => {
    expect(
      orderCacheFieldsForPwaOrder({
        odooSaleOrderId: 88,
        orderStatus: 'PAYMENT_PENDING',
        paymentStatus: 'PENDING',
      }),
    ).toEqual({ status: 'payment_pending', paymentStatus: 'pending' })
  })

  it('mappa gli ordini pagati sulla cache sale/paid', () => {
    expect(
      orderCacheFieldsForPwaOrder({
        odooSaleOrderId: 88,
        orderStatus: 'PAID',
        paymentStatus: 'CAPTURED',
      }),
    ).toEqual({ status: 'sale', paymentStatus: 'paid' })
  })

  it('ignora i checkout non ancora confermati', () => {
    expect(
      orderCacheFieldsForPwaOrder({
        odooSaleOrderId: 88,
        orderStatus: 'CHECKOUT_STARTED',
        paymentStatus: 'NOT_STARTED',
      }),
    ).toBeNull()
  })
})
