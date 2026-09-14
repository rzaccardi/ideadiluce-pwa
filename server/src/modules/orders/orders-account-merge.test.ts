import { describe, expect, it } from 'vitest'
import type { PwaOrder } from '@prisma/client'
import { mergePwaOrdersIntoList } from './orders-account-merge.js'
import type { OrderDTO } from '../../types/dto.js'
import { OPEN_RETURN_WINDOW } from './order-return-window.js'

function cacheOrder(partial: Partial<OrderDTO> = {}): OrderDTO {
  return {
    id: 'pwa-ord-1',
    pwaOrderId: 'ord-1',
    odooSaleOrderId: 88,
    orderNumber: '#IDL-2026-00088',
    status: 'sale',
    paymentStatus: 'paid',
    currencyCode: 'EUR',
    totalAmount: 1000,
    createdAt: '2026-09-14T00:00:00.000Z',
    odooPortalUrl: null,
    source: 'pwa',
    sourceLabel: 'E-commerce',
    returnRequest: null,
    shipment: null,
    returnWindow: OPEN_RETURN_WINDOW,
    ...partial,
  }
}

function pwaOrder(partial: Partial<PwaOrder> = {}): PwaOrder {
  return {
    id: 'ord-1',
    odooSaleOrderId: 88,
    odooSaleOrderName: '4CSVKG',
    orderStatus: 'PAYMENT_PENDING',
    paymentStatus: 'PENDING',
    paymentMethod: 'BANK_TRANSFER',
    currencyCode: 'EUR',
    amountTotal: 1000,
    paidAt: null,
    createdAt: new Date('2026-09-14T00:00:00.000Z'),
    ...partial,
  } as PwaOrder
}

describe('mergePwaOrdersIntoList', () => {
  it('sovrascrive la cache sale/paid con lo stato pending del bonifico', () => {
    const list = [cacheOrder()]
    mergePwaOrdersIntoList(list, [pwaOrder()])
    expect(list).toHaveLength(1)
    expect(list[0]?.status).toBe('payment_pending')
    expect(list[0]?.paymentStatus).toBe('pending')
    expect(list[0]?.orderNumber).toBe('4CSVKG')
    expect(list[0]?.id).toBe('4CSVKG')
  })

  it('aggiunge l’ordine bonifico se manca dalla cache', () => {
    const list: OrderDTO[] = []
    mergePwaOrdersIntoList(list, [pwaOrder()])
    expect(list).toHaveLength(1)
    expect(list[0]?.status).toBe('payment_pending')
    expect(list[0]?.pwaOrderId).toBe('ord-1')
    expect(list[0]?.orderNumber).toBe('4CSVKG')
  })
})
