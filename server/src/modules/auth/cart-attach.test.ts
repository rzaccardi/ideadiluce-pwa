import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  cartUpdateMany,
  cartFindFirst,
  cartFindMany,
  cartUpdate,
  cartDeleteMany,
  cartItemDeleteMany,
  cartItemCreateMany,
  bumpCartReservation,
  detachActiveCartsBoundToPendingBankTransfer,
} = vi.hoisted(() => ({
  cartUpdateMany: vi.fn(),
  cartFindFirst: vi.fn(),
  cartFindMany: vi.fn(),
  cartUpdate: vi.fn(),
  cartDeleteMany: vi.fn(),
  cartItemDeleteMany: vi.fn(),
  cartItemCreateMany: vi.fn(),
  bumpCartReservation: vi.fn(),
  detachActiveCartsBoundToPendingBankTransfer: vi.fn(async () => []),
}))

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    cart: {
      updateMany: cartUpdateMany,
      findFirst: cartFindFirst,
      findMany: cartFindMany,
      update: cartUpdate,
      deleteMany: cartDeleteMany,
    },
    cartItem: {
      deleteMany: cartItemDeleteMany,
      createMany: cartItemCreateMany,
    },
    wishlistItem: { findMany: vi.fn(async () => []), deleteMany: vi.fn(), createMany: vi.fn() },
    customerSatellite: { findUniqueOrThrow: vi.fn() },
    session: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn(), deleteMany: vi.fn() },
    $transaction: vi.fn(async (fn: (tx: unknown) => unknown) =>
      fn({
        cart: { deleteMany: cartDeleteMany, update: cartUpdate },
        cartItem: { deleteMany: cartItemDeleteMany, createMany: cartItemCreateMany },
      }),
    ),
  },
}))

vi.mock('../../config/env.js', () => ({
  env: { SESSION_DAYS: 30, ODOO_ENABLED: false },
}))

vi.mock('./auth.repository.js', () => ({
  authRepository: {
    findSatelliteByEmail: vi.fn(),
    createUser: vi.fn(),
    linkSessionToIdentity: vi.fn(),
  },
}))

vi.mock('./odoo-account-sync.service.js', () => ({
  loginWithOdooCredentials: vi.fn(),
  provisionOdooAuthIdentity: vi.fn(),
  assertOdooAuthReadyForIdentity: vi.fn(),
  isOdooAuthIdentityRequired: vi.fn(() => false),
}))

vi.mock('./satellite-projection.service.js', () => ({
  ensureSatelliteProjection: vi.fn(),
}))

vi.mock('../users/users-odoo-business-hydrate.js', () => ({
  hydrateUserBusinessFromOdoo: vi.fn(async (u: unknown) => u),
}))

vi.mock('../users/user.mapper.js', () => ({
  toUserDTO: vi.fn(async (u: unknown) => u),
}))

vi.mock('../orders/orders-user-link.service.js', () => ({
  linkOrdersToUser: vi.fn(),
}))

vi.mock('../../adapters/odoo-api/odooApiClient.js', () => ({
  isOdooApiV2Configured: () => false,
}))

vi.mock('../../adapters/odoo-api/odooApi.resources.js', () => ({
  odooApiCreateBusinessRequest: vi.fn(),
}))

vi.mock('../../lib/logger.js', () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}))

vi.mock('../cart/cart.reservation.js', () => ({
  bumpCartReservation: (...args: unknown[]) => bumpCartReservation(...args),
}))

vi.mock('../cart/cart-bank-transfer-guard.js', () => ({
  detachActiveCartsBoundToPendingBankTransfer: (...args: unknown[]) =>
    detachActiveCartsBoundToPendingBankTransfer(...args),
}))

import { mergeCartsForUser } from './auth.service.js'

describe('mergeCartsForUser cart attach modes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    cartUpdateMany.mockResolvedValue({ count: 0 })
    cartFindFirst.mockResolvedValue(null)
    cartFindMany.mockResolvedValue([])
  })

  it('adopt_session: claims guest cart and abandons other partner ACTIVE carts without merging lines', async () => {
    cartFindFirst.mockResolvedValue({
      id: 'guest-cart',
      sessionId: 'sess-1',
      items: [{ id: 'i1', productRef: 'p1', variantRef: null, quantity: 2 }],
    })

    await mergeCartsForUser('sess-1', 42, { mode: 'adopt_session' })

    expect(cartUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { sessionId: 'sess-1', odooPartnerId: null, status: 'ACTIVE' },
        data: { odooPartnerId: 42 },
      }),
    )
    expect(detachActiveCartsBoundToPendingBankTransfer).toHaveBeenCalledWith(42)
    expect(cartUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: 'ACTIVE', odooPartnerId: 42, id: { not: 'guest-cart' } },
        data: expect.objectContaining({ status: 'ABANDONED', sessionId: null }),
      }),
    )
    expect(cartFindMany).not.toHaveBeenCalled()
    expect(cartDeleteMany).not.toHaveBeenCalled()
    expect(cartItemCreateMany).not.toHaveBeenCalled()
    expect(bumpCartReservation).toHaveBeenCalledWith('guest-cart', true)
  })

  it('adopt_session: with no session cart abandons all partner ACTIVE carts (no restore)', async () => {
    cartFindFirst.mockResolvedValue(null)

    await mergeCartsForUser('sess-1', 42, { mode: 'adopt_session' })

    expect(cartUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: 'ACTIVE', odooPartnerId: 42 },
        data: expect.objectContaining({ status: 'ABANDONED', sessionId: null }),
      }),
    )
    expect(bumpCartReservation).not.toHaveBeenCalled()
    expect(cartFindMany).not.toHaveBeenCalled()
  })

  it('merge (default): consolidates multiple ACTIVE carts into one', async () => {
    cartFindMany.mockResolvedValue([
      {
        id: 'older',
        sessionId: null,
        items: [
          {
            productRef: 'a',
            variantRef: null,
            quantity: 1,
            clientUnitPriceEstimate: 100,
            metadataJson: null,
          },
        ],
      },
      {
        id: 'newer',
        sessionId: 'sess-1',
        items: [
          {
            productRef: 'b',
            variantRef: null,
            quantity: 1,
            clientUnitPriceEstimate: 200,
            metadataJson: null,
          },
        ],
      },
    ])

    await mergeCartsForUser('sess-1', 42)

    expect(cartDeleteMany).toHaveBeenCalled()
    expect(cartItemCreateMany).toHaveBeenCalled()
    expect(bumpCartReservation).toHaveBeenCalledWith('older', true)
  })
})
