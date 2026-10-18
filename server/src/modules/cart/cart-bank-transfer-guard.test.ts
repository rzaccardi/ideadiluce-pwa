import { beforeEach, describe, expect, it, vi } from 'vitest'

const prismaMock = vi.hoisted(() => ({
  pwaOrder: { findMany: vi.fn(), findFirst: vi.fn() },
  cart: { findUnique: vi.fn() },
}))

const releaseShoppingCartAfterOrder = vi.hoisted(() => vi.fn())

vi.mock('../../lib/prisma.js', () => ({ prisma: prismaMock }))
vi.mock('./cart-release.service.js', () => ({ releaseShoppingCartAfterOrder }))

import {
  detachActiveCartsBoundToPendingBankTransfer,
  releaseCartIfBankTransferPending,
} from './cart-bank-transfer-guard.js'

describe('cart-bank-transfer-guard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('detachActiveCartsBoundToPendingBankTransfer converte senza svuotare gli altri ACTIVE', async () => {
    prismaMock.pwaOrder.findMany.mockResolvedValue([
      {
        id: 'ord-bt',
        cartId: 'cart-pending',
        sessionId: 'sess-1',
        odooPartnerId: 9,
      },
    ])
    prismaMock.cart.findUnique.mockResolvedValue({ id: 'cart-pending', status: 'ACTIVE' })

    const detached = await detachActiveCartsBoundToPendingBankTransfer(9)

    expect(detached).toEqual(['cart-pending'])
    expect(releaseShoppingCartAfterOrder).toHaveBeenCalledWith({
      orderId: 'ord-bt',
      cartId: 'cart-pending',
      sessionId: 'sess-1',
      odooPartnerId: 9,
      clearOtherActive: false,
    })
  })

  it('releaseCartIfBankTransferPending di default non svuota gli altri ACTIVE', async () => {
    prismaMock.pwaOrder.findFirst.mockResolvedValue({
      id: 'ord-bt',
      cartId: 'cart-1',
      sessionId: 'sess-1',
      odooPartnerId: 3,
    })

    await expect(releaseCartIfBankTransferPending('cart-1')).resolves.toBe(true)
    expect(releaseShoppingCartAfterOrder).toHaveBeenCalledWith({
      orderId: 'ord-bt',
      cartId: 'cart-1',
      sessionId: 'sess-1',
      odooPartnerId: 3,
      clearOtherActive: false,
    })
  })

  it('releaseCartIfBankTransferPending con clearOtherActive chiude anche leftover', async () => {
    prismaMock.pwaOrder.findFirst.mockResolvedValue({
      id: 'ord-bt',
      cartId: 'cart-1',
      sessionId: 'sess-1',
      odooPartnerId: 3,
    })

    await expect(
      releaseCartIfBankTransferPending('cart-1', { clearOtherActive: true }),
    ).resolves.toBe(true)
    expect(releaseShoppingCartAfterOrder).toHaveBeenCalledWith({
      orderId: 'ord-bt',
      cartId: 'cart-1',
      sessionId: 'sess-1',
      odooPartnerId: 3,
      clearOtherActive: true,
    })
  })

  it('releaseCartIfBankTransferPending no-op se non c’è bonifico pending', async () => {
    prismaMock.pwaOrder.findFirst.mockResolvedValue(null)
    await expect(releaseCartIfBankTransferPending('cart-1')).resolves.toBe(false)
    expect(releaseShoppingCartAfterOrder).not.toHaveBeenCalled()
  })
})
