import { beforeEach, describe, expect, it, vi } from 'vitest'

const prismaMock = vi.hoisted(() => ({
  cart: {
    update: vi.fn(),
    findMany: vi.fn(),
    updateMany: vi.fn(),
  },
  cartItem: { deleteMany: vi.fn() },
  cartShippingSelection: { deleteMany: vi.fn() },
}))

vi.mock('../../lib/prisma.js', () => ({
  prisma: prismaMock,
}))

import { releaseShoppingCartAfterOrder } from './cart-release.service.js'

describe('releaseShoppingCartAfterOrder', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.cart.update.mockResolvedValue({})
    prismaMock.cart.findMany.mockResolvedValue([])
    prismaMock.cart.updateMany.mockResolvedValue({ count: 0 })
    prismaMock.cartItem.deleteMany.mockResolvedValue({ count: 0 })
    prismaMock.cartShippingSelection.deleteMany.mockResolvedValue({ count: 0 })
  })

  it('converte il carrello dell’ordine e svuota gli altri carrelli attivi dello stesso utente', async () => {
    prismaMock.cart.findMany.mockResolvedValue([{ id: 'cart-shop' }])

    await releaseShoppingCartAfterOrder({
      orderId: 'ord-1',
      cartId: 'cart-order',
      sessionId: 'sess-1',
      odooPartnerId: 42,
    })

    expect(prismaMock.cart.update).toHaveBeenCalledWith({
      where: { id: 'cart-order' },
      data: { status: 'CONVERTED', convertedOrderId: 'ord-1' },
    })
    expect(prismaMock.cart.findMany).toHaveBeenCalledWith({
      where: {
        id: { not: 'cart-order' },
        status: 'ACTIVE',
        OR: [{ sessionId: 'sess-1' }, { odooPartnerId: 42 }],
      },
      select: { id: true },
    })
    expect(prismaMock.cartItem.deleteMany).toHaveBeenCalledWith({
      where: { cartId: { in: ['cart-shop'] } },
    })
    expect(prismaMock.cartShippingSelection.deleteMany).toHaveBeenCalledWith({
      where: { cartId: { in: ['cart-shop'] } },
    })
    expect(prismaMock.cart.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['cart-shop'] } },
      data: {
        estimatedSubtotal: null,
        estimatedTax: null,
        estimatedShipping: null,
        estimatedTotal: null,
        lastPricedAt: null,
        reservationStartedAt: null,
        reservationExpiresAt: null,
      },
    })
  })

  it('non cerca altri carrelli se manca sia sessione sia partner', async () => {
    await releaseShoppingCartAfterOrder({
      orderId: 'ord-1',
      cartId: 'cart-order',
      sessionId: null,
      odooPartnerId: null,
    })

    expect(prismaMock.cart.update).toHaveBeenCalledOnce()
    expect(prismaMock.cart.findMany).not.toHaveBeenCalled()
  })

  it('con clearOtherActive=false converte solo il carrello ordine', async () => {
    await releaseShoppingCartAfterOrder({
      orderId: 'ord-1',
      cartId: 'cart-order',
      sessionId: 'sess-1',
      odooPartnerId: 42,
      clearOtherActive: false,
    })

    expect(prismaMock.cart.update).toHaveBeenCalledOnce()
    expect(prismaMock.cart.findMany).not.toHaveBeenCalled()
  })
})