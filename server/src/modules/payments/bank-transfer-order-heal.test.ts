import { beforeEach, describe, expect, it, vi } from 'vitest'

const prismaMock = vi.hoisted(() => ({
  pwaOrder: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
}))

vi.mock('../../lib/prisma.js', () => ({
  prisma: prismaMock,
}))

import { healBankTransferFalselyMarkedFailed } from './bank-transfer-order-heal.js'

describe('healBankTransferFalselyMarkedFailed', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('ripristina pending se Stripe ha marcato fallito un bonifico già confermato', async () => {
    prismaMock.pwaOrder.findUnique.mockResolvedValue({
      id: 'ord-1',
      paymentMethod: 'BANK_TRANSFER',
      orderStatus: 'PAYMENT_FAILED',
      paymentStatus: 'FAILED',
      payments: [{ method: 'BANK_TRANSFER', status: 'PENDING' }],
    })
    prismaMock.pwaOrder.update.mockResolvedValue({})

    await expect(healBankTransferFalselyMarkedFailed('ord-1')).resolves.toBe(true)
    expect(prismaMock.pwaOrder.update).toHaveBeenCalledWith({
      where: { id: 'ord-1' },
      data: {
        orderStatus: 'PAYMENT_PENDING',
        paymentStatus: 'PENDING',
        lastPaymentError: null,
      },
    })
  })

  it('non tocca un ordine Stripe fallito', async () => {
    prismaMock.pwaOrder.findUnique.mockResolvedValue({
      id: 'ord-2',
      paymentMethod: 'STRIPE',
      orderStatus: 'PAYMENT_FAILED',
      paymentStatus: 'FAILED',
      payments: [{ method: 'STRIPE', status: 'FAILED' }],
    })

    await expect(healBankTransferFalselyMarkedFailed('ord-2')).resolves.toBe(false)
    expect(prismaMock.pwaOrder.update).not.toHaveBeenCalled()
  })
})
