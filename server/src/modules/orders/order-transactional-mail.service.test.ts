import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PwaOrder } from '@prisma/client'

const { sendPwaMail, finalizeGuestAccountForOrder } = vi.hoisted(() => ({
  sendPwaMail: vi.fn(),
  finalizeGuestAccountForOrder: vi.fn(),
}))

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    pwaOrder: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    pwaPayment: {
      findFirst: vi.fn(),
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
    vi.mocked(prisma.pwaOrder.findUnique).mockResolvedValue({ metadataJson: {} } as never)
    vi.mocked(prisma.pwaOrder.update).mockResolvedValue({} as never)
  })

  it('invia conferma ordine e marca il metadata', async () => {
    await orderTransactionalMail.sendOrderConfirmation(order(), 'c1')
    expect(sendPwaMail).toHaveBeenCalledWith(
      { correlationId: 'c1' },
      expect.objectContaining({
        templateKey: 'order_confirmation',
        emailTo: 'mario@test.it',
        vars: expect.objectContaining({
          first_name_suffix: ' Mario',
          order_number: `#IDL-${new Date().getFullYear()}-00042`,
          amount: '€ 129.00',
          order_url: 'https://www.ideadiluce.com/checkout/result/ord-aaaaaaaa',
        }),
      }),
    )
    expect(prisma.pwaOrder.update).toHaveBeenCalled()
  })

  it('non reinvia la conferma se già spedita', async () => {
    await orderTransactionalMail.sendOrderConfirmation(
      order({ metadataJson: { pwaMail: { orderConfirmationSentAt: '2026-01-01T00:00:00.000Z' } } }),
      'c1',
    )
    expect(sendPwaMail).not.toHaveBeenCalled()
  })

  it('invia istruzioni bonifico con IBAN', async () => {
    vi.mocked(prisma.pwaPayment.findFirst).mockResolvedValue({
      instructionsJson: {
        holder: 'TLB Italy Srl',
        iban: 'IT00X0000000000000000000000',
        bankName: 'Banca <Test>',
        reference: 'IDL-42',
        amount: 12900,
        currencyCode: 'EUR',
        note: 'Entro 5 giorni',
      },
    } as never)

    await orderTransactionalMail.sendBankTransferInstructions(order(), 'c2')
    expect(sendPwaMail).toHaveBeenCalledWith(
      { correlationId: 'c2' },
      expect.objectContaining({
        templateKey: 'bank_transfer_pending',
        vars: expect.objectContaining({
          iban: 'IT00X0000000000000000000000',
          bank_name_html: '<br/>Banca: Banca &lt;Test&gt;',
          reference: 'IDL-42',
        }),
      }),
    )
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
