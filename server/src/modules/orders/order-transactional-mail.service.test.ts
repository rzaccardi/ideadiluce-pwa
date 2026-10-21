import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PwaOrder } from '@prisma/client'

const { sendPwaMail, finalizeGuestAccountForOrder, envState, odooConfigured } = vi.hoisted(() => ({
  sendPwaMail: vi.fn(),
  finalizeGuestAccountForOrder: vi.fn(),
  envState: { ODOO_ENABLED: true, PUBLIC_SITE_URL: 'https://www.ideadiluce.com', PWA_ORDER_CONFIRMATION_MAIL: true },
  odooConfigured: { value: true },
}))

vi.mock('../../config/env.js', () => ({
  env: envState,
}))

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    pwaOrder: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('../../lib/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

vi.mock('../../lib/mail.js', () => ({
  publicAppUrl: (path: string) => `https://www.ideadiluce.com${path}`,
}))

vi.mock('../../adapters/odoo/odooMailAdapter.js', () => ({
  sendPwaMail,
}))

vi.mock('../../adapters/odoo/odooClient.js', () => ({
  isOdooConfigured: () => odooConfigured.value,
}))

vi.mock('../auth/guest-account.service.js', () => ({
  finalizeGuestAccountForOrder,
}))

import { prisma } from '../../lib/prisma.js'
import { orderTransactionalMail } from './order-transactional-mail.service.js'

function order(overrides: Partial<PwaOrder> = {}): PwaOrder {
  return {
    id: 'ord-aaaaaaaa',
    email: 'mario@test.it',
    odooSaleOrderId: 42,
    amountTotal: 12900,
    currencyCode: 'EUR',
    shippingAddressJson: { firstName: 'Mario' },
    metadataJson: {},
    ...overrides,
  } as PwaOrder
}

describe('orderTransactionalMail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sendPwaMail.mockResolvedValue(undefined)
    finalizeGuestAccountForOrder.mockResolvedValue(undefined)
    envState.ODOO_ENABLED = true
    envState.PWA_ORDER_CONFIRMATION_MAIL = true
    odooConfigured.value = true
    vi.mocked(prisma.pwaOrder.findUnique).mockResolvedValue({ metadataJson: {} } as never)
    vi.mocked(prisma.pwaOrder.update).mockResolvedValue({} as never)
  })

  it('con PWA_ORDER_CONFIRMATION_MAIL spenta non invia la conferma: la manda Odoo', async () => {
    envState.PWA_ORDER_CONFIRMATION_MAIL = false
    await orderTransactionalMail.notifyPaidCustomer(order(), 'c0')
    expect(sendPwaMail).not.toHaveBeenCalled()
    expect(finalizeGuestAccountForOrder).toHaveBeenCalledWith('ord-aaaaaaaa')
  })

  it('invia conferma ordine collegata al sale.order e marca il metadata', async () => {
    await orderTransactionalMail.sendOrderConfirmation(order(), 'c1')
    expect(sendPwaMail).toHaveBeenCalledWith(
      { correlationId: 'c1' },
      expect.objectContaining({
        templateKey: 'order_confirmation',
        emailTo: 'mario@test.it',
        record: { model: 'sale.order', resId: 42 },
        vars: expect.objectContaining({
          first_name_suffix: ' Mario',
          order_number: `#IDL-${new Date().getFullYear()}-00042`,
          amount: '€ 129.00',
          order_url: 'https://www.ideadiluce.com/account/orders/pwa-ord-aaaaaaaa',
        }),
      }),
    )
    expect(prisma.pwaOrder.update).toHaveBeenCalled()
  })

  it('differisce la conferma se Odoo è attivo ma manca sale.order', async () => {
    await orderTransactionalMail.sendOrderConfirmation(order({ odooSaleOrderId: null }), 'c1')
    expect(sendPwaMail).not.toHaveBeenCalled()
    expect(prisma.pwaOrder.update).not.toHaveBeenCalled()
  })

  it('invia subito la conferma senza record se Odoo è disabilitato', async () => {
    envState.ODOO_ENABLED = false
    odooConfigured.value = false
    await orderTransactionalMail.sendOrderConfirmation(order({ odooSaleOrderId: null }), 'c1')
    expect(sendPwaMail).toHaveBeenCalledWith(
      { correlationId: 'c1' },
      expect.objectContaining({
        templateKey: 'order_confirmation',
        record: undefined,
      }),
    )
  })

  it('usa il codice Odoo a 6 caratteri nell’URL area clienti', async () => {
    await orderTransactionalMail.sendOrderConfirmation(order({ odooSaleOrderName: '4CSVKG' }), 'c1')
    expect(sendPwaMail).toHaveBeenCalledWith(
      { correlationId: 'c1' },
      expect.objectContaining({
        vars: expect.objectContaining({
          order_number: '4CSVKG',
          order_url: 'https://www.ideadiluce.com/account/orders/4CSVKG',
        }),
      }),
    )
  })

  it('manda comunque la conferma [PWA] anche se l’API v2 è attiva', async () => {
    await orderTransactionalMail.sendOrderConfirmation(order({ odooSaleOrderName: '4CSVKG' }), 'c1')
    expect(sendPwaMail).toHaveBeenCalledWith(
      { correlationId: 'c1' },
      expect.objectContaining({
        templateKey: 'order_confirmation',
        vars: expect.objectContaining({
          order_url: 'https://www.ideadiluce.com/account/orders/4CSVKG',
        }),
      }),
    )
  })

  it('non reinvia la conferma se già spedita', async () => {
    await orderTransactionalMail.sendOrderConfirmation(
      order({ metadataJson: { pwaMail: { orderConfirmationSentAt: '2026-01-01T00:00:00.000Z' } } }),
      'c1',
    )
    expect(sendPwaMail).not.toHaveBeenCalled()
  })

  it('invia tracking solo con URL http(s) e HTML escapato', async () => {
    await orderTransactionalMail.sendShipmentNotice(
      order(),
      {
        carrierLabel: 'DHL',
        trackingNumber: '1Z<>',
        trackingUrl: 'https://www.dhl.com/track?n=1',
      },
      'c3',
    )
    const vars = sendPwaMail.mock.calls[0]?.[1]?.vars as Record<string, string>
    expect(vars.carrier_line).toBe(' con DHL')
    expect(vars.tracking_html).toContain('https://www.dhl.com/track?n=1')
    expect(vars.tracking_html).toContain('1Z&lt;&gt;')
    expect(vars.tracking_html).not.toContain('javascript:')
  })

  it('ignora tracking con URL non http', async () => {
    await orderTransactionalMail.sendShipmentNotice(
      order(),
      { carrierLabel: null, trackingNumber: 'ABC', trackingUrl: 'javascript:alert(1)' },
      'c3',
    )
    const vars = sendPwaMail.mock.calls[0]?.[1]?.vars as Record<string, string>
    expect(vars.tracking_html).toBe('Tracking: ABC')
  })

  it('non invia reminder carrello senza email valida', async () => {
    await orderTransactionalMail.sendAbandonedCartReminder(order({ email: 'ospite' }), 'c4')
    expect(sendPwaMail).not.toHaveBeenCalled()
  })

  it('notifyPaidCustomer conferma e crea account ospite', async () => {
    await orderTransactionalMail.notifyPaidCustomer(order(), 'c5')
    expect(sendPwaMail).toHaveBeenCalled()
    expect(finalizeGuestAccountForOrder).toHaveBeenCalledWith('ord-aaaaaaaa')
  })
})
