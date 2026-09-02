import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PwaOrder } from '@prisma/client'

const { sendAbandonedCartReminder, syncSaleOrderFunnelState, recordAbandonedCartEvent } = vi.hoisted(
  () => ({
    sendAbandonedCartReminder: vi.fn(),
    syncSaleOrderFunnelState: vi.fn(),
    recordAbandonedCartEvent: vi.fn(),
  }),
)

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    pwaOrder: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    cart: {
      update: vi.fn(),
    },
  },
}))

vi.mock('../adapters/odoo/odooFunnelSync.js', () => ({
  syncSaleOrderFunnelState,
}))

vi.mock('../modules/cart/cart-contact.service.js', () => ({
  recordAbandonedCartEvent,
}))

vi.mock('../modules/orders/order-transactional-mail.service.js', () => ({
  orderTransactionalMail: { sendAbandonedCartReminder },
}))

import { prisma } from '../lib/prisma.js'
import { processAbandonedCheckoutCandidates } from './abandonedCart.job.js'

describe('processAbandonedCheckoutCandidates', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sendAbandonedCartReminder.mockResolvedValue(undefined)
    syncSaleOrderFunnelState.mockResolvedValue(undefined)
    recordAbandonedCartEvent.mockResolvedValue(undefined)
    vi.mocked(prisma.cart.update).mockResolvedValue({} as never)
  })

  it('marca solo checkout/pagamento avviati e invia reminder', async () => {
    const candidate = {
      id: 'ord-1',
      cartId: 'cart-1',
      email: 'a@b.it',
      odooSaleOrderId: 9,
      paymentStatus: 'PENDING',
      paymentMethod: 'STRIPE',
      sessionId: 's1',
      lastPaymentError: null,
      providerTransactionId: null,
    } as unknown as PwaOrder
    vi.mocked(prisma.pwaOrder.findMany).mockResolvedValue([candidate] as never)
    vi.mocked(prisma.pwaOrder.update).mockResolvedValue({ ...candidate, orderStatus: 'ABANDONED' } as never)

    const result = await processAbandonedCheckoutCandidates()
    expect(result.marked).toBe(1)
    expect(prisma.pwaOrder.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          orderStatus: { in: ['CHECKOUT_STARTED', 'PAYMENT_STARTED'] },
        }),
      }),
    )
    expect(sendAbandonedCartReminder).toHaveBeenCalled()
    expect(syncSaleOrderFunnelState).toHaveBeenCalled()
  })
})
