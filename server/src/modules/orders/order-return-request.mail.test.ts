import { describe, expect, it } from 'vitest'
import type { OrderDetailDTO } from '../../types/dto.js'
import {
  buildAdminReturnRequestEmail,
  buildCustomerReturnRequestEmail,
  customerNotificationCopy,
} from './order-return-request.mail.js'

const order: OrderDetailDTO = {
  id: 'pwa-ord-1',
  pwaOrderId: 'ord-1',
  odooSaleOrderId: 1042,
  status: 'paid',
  paymentStatus: 'captured',
  currencyCode: 'EUR',
  totalAmount: 12900,
  createdAt: '2026-08-20T10:00:00.000Z',
  odooPortalUrl: null,
    source: 'pwa',
    sourceLabel: 'E-commerce',
    returnRequest: null,
    shipment: null,
    returnWindow: {
      eligible: true,
      reason: 'not_delivered',
      deliveredAt: null,
      expiresAt: null,
      daysRemaining: null,
    },
  lines: [
    {
      productRef: 'odoo:t:1',
      variantRef: null,
      quantity: 1,
      productSlug: 'lampada',
      productName: 'Lampada sospensione',
      imageUrl: null,
      unitPriceCents: 12900,
      lineTotalCents: 12900,
    },
  ],
  lineCount: 1,
  isSingleItem: true,
}

const baseInput = {
  requestId: 'ret-1',
  customerName: 'Marco',
  customerEmail: 'marco@example.com',
  notes: 'Imballo danneggiato',
  order,
  orderUrl: 'https://www.ideadiluce.com/account/orders/pwa-ord-1',
}

describe('buildAdminReturnRequestEmail', () => {
  it('include ordine, cliente e note per info@', () => {
    const mail = buildAdminReturnRequestEmail({ ...baseInput, locale: 'IT' })
    expect(mail.subject).toContain('Richiesta di reso')
    expect(mail.subject).toContain('#1042')
    expect(mail.text).toContain('marco@example.com')
    expect(mail.text).toContain('Lampada sospensione')
    expect(mail.text).toContain('Imballo danneggiato')
    expect(mail.text).toContain('ord-1')
  })
})

describe('buildCustomerReturnRequestEmail', () => {
  it('conferma il reso e anticipa le indicazioni (IT)', () => {
    const mail = buildCustomerReturnRequestEmail({ ...baseInput, locale: 'IT' })
    expect(mail.subject).toContain('Richiesta di reso ricevuta')
    expect(mail.text).toContain('Ciao Marco,')
    expect(mail.text).toContain('ordine #1042')
    expect(mail.text).toContain('A breve riceverai indicazioni')
    expect(mail.text).toContain(baseInput.orderUrl)
    expect(mail.text).toContain('Imballo danneggiato')
  })

  it('localizza EN', () => {
    const mail = buildCustomerReturnRequestEmail({ ...baseInput, locale: 'EN' })
    expect(mail.subject).toContain('Return request received')
    expect(mail.text).toContain('Hello Marco,')
    expect(mail.text).toContain('shortly receive instructions')
  })
})

describe('customerNotificationCopy', () => {
  it('restituisce il testo in-app in italiano', () => {
    expect(customerNotificationCopy('IT').title).toBe('Richiesta di reso inviata')
  })
})
