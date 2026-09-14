import { describe, expect, it } from 'vitest'
import {
  accountOrderPublicId,
  applyPwaOrderPublicIds,
  isOdooOrderPublicName,
} from './orders-account-id.js'
import type { OrderDTO } from '../../types/dto.js'
import { OPEN_RETURN_WINDOW } from './order-return-window.js'

function order(partial: Partial<OrderDTO>): OrderDTO {
  return {
    id: 'pwa-ord-1',
    pwaOrderId: 'ord-1',
    odooSaleOrderId: 88,
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

describe('accountOrderPublicId', () => {
  it('usa il codice Odoo a 6 caratteri', () => {
    expect(accountOrderPublicId({ id: 'ord-1', odooSaleOrderName: '4CSVKG' })).toBe('4CSVKG')
    expect(accountOrderPublicId({ id: 'ord-1', odooSaleOrderName: null })).toBe('pwa-ord-1')
  })

  it('riconosce il nome pubblico Odoo', () => {
    expect(isOdooOrderPublicName('4CSVKG')).toBe(true)
    expect(isOdooOrderPublicName('pwa-ord-1')).toBe(false)
  })
})

describe('applyPwaOrderPublicIds', () => {
  it('sostituisce pwa-{id} con il codice Odoo e riallinea lo storico API', () => {
    const list = [
      order({ id: 'pwa-ord-1' }),
      order({
        id: '4CSVKG',
        pwaOrderId: null,
        source: 'odoo_historical',
        sourceLabel: 'Odoo',
      }),
    ]
    applyPwaOrderPublicIds(list, [{ id: 'ord-1', odooSaleOrderId: 88, odooSaleOrderName: '4CSVKG' }])
    expect(list[0]?.id).toBe('4CSVKG')
    expect(list[1]?.id).toBe('4CSVKG')
    expect(list[1]?.pwaOrderId).toBe('ord-1')
    expect(list[1]?.source).toBe('pwa')
    expect(list[1]?.sourceLabel).toBe('E-commerce')
  })
})
