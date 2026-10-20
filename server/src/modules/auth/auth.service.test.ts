import { beforeEach, describe, expect, it, vi } from 'vitest'
import bcrypt from 'bcryptjs'
import { AppError } from '../../types/errors.js'

const {
  findSatelliteByEmail,
  createUser,
  linkSessionToIdentity,
  prismaUserFindUniqueOrThrow,
  sendPwaMail,
  odooApiCreateBusinessRequest,
  isOdooApiV2Configured,
  loginWithOdooCredentials,
  provisionOdooAuthIdentity,
  assertOdooAuthReadyForIdentity,
  isOdooAuthIdentityRequired,
  ensureSatelliteProjection,
  hydrateUserBusinessFromOdoo,
  toUserDTO,
  linkOrdersToUser,
} = vi.hoisted(() => ({
  findSatelliteByEmail: vi.fn(),
  createUser: vi.fn(),
  linkSessionToIdentity: vi.fn(),
  prismaUserFindUniqueOrThrow: vi.fn(),
  sendPwaMail: vi.fn(),
  odooApiCreateBusinessRequest: vi.fn(),
  isOdooApiV2Configured: vi.fn(() => false),
  loginWithOdooCredentials: vi.fn(),
  provisionOdooAuthIdentity: vi.fn(),
  assertOdooAuthReadyForIdentity: vi.fn(),
  isOdooAuthIdentityRequired: vi.fn(() => false),
  ensureSatelliteProjection: vi.fn(),
  hydrateUserBusinessFromOdoo: vi.fn(async (u: unknown) => u),
  toUserDTO: vi.fn(async (u: { id: string; email: string }) => u),
  linkOrdersToUser: vi.fn(),
}))

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    customerSatellite: {
      findUniqueOrThrow: prismaUserFindUniqueOrThrow,
      findUnique: vi.fn(),
    },
    cart: { updateMany: vi.fn(), findMany: vi.fn(async () => []), update: vi.fn() },
    wishlistItem: { findMany: vi.fn(async () => []), deleteMany: vi.fn(), createMany: vi.fn() },
    session: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn(), deleteMany: vi.fn() },
    pwaOrder: { findMany: vi.fn(async () => []), updateMany: vi.fn() },
    $transaction: vi.fn(async (fn: (tx: unknown) => unknown) => fn({})),
  },
}))

vi.mock('./auth.repository.js', () => ({
  authRepository: {
    findSatelliteByEmail,
    findUserByEmail: findSatelliteByEmail,
    createUser,
    linkSessionToIdentity,
    linkSessionToUser: vi.fn(),
  },
}))

vi.mock('./odoo-account-sync.service.js', () => ({
  loginWithOdooCredentials,
  provisionOdooAuthIdentity,
  assertOdooAuthReadyForIdentity,
  isOdooAuthIdentityRequired,
}))

vi.mock('./satellite-projection.service.js', () => ({
  ensureSatelliteProjection,
}))

vi.mock('../users/users-odoo-business-hydrate.js', () => ({
  hydrateUserBusinessFromOdoo,
}))

vi.mock('../users/user.mapper.js', () => ({
  toUserDTO,
}))

vi.mock('../orders/orders-user-link.service.js', () => ({
  linkOrdersToUser,
}))

vi.mock('../../adapters/odoo/odooMailAdapter.js', () => ({
  sendPwaMail,
  PWA_ADMIN_MAIL_TO: 'admin@example.com',
}))

vi.mock('../../adapters/odoo-api/odooApiClient.js', () => ({
  isOdooApiV2Configured: () => isOdooApiV2Configured(),
}))

vi.mock('../../adapters/odoo-api/odooApi.resources.js', () => ({
  odooApiCreateBusinessRequest: (...args: unknown[]) => odooApiCreateBusinessRequest(...args),
}))

vi.mock('../../lib/mail.js', () => ({
  publicAppUrl: (path: string) => `https://shop.test${path}`,
}))

vi.mock('../../config/env.js', () => ({
  env: { SESSION_DAYS: 14, ODOO_ENABLED: false },
}))

vi.mock('../cart/cart.reservation.js', () => ({
  bumpCartReservation: vi.fn(),
}))

import { authService } from './auth.service.js'

describe('authService.register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isOdooAuthIdentityRequired.mockReturnValue(false)
    findSatelliteByEmail.mockResolvedValue(null)
    createUser.mockResolvedValue({
      id: 'u1',
      email: 'new@example.com',
      firstName: 'Ada',
      lastName: 'Lovelace',
      phone: null,
      companyName: null,
      vatNumber: null,
      odooPartnerId: -1,
    })
    sendPwaMail.mockResolvedValue(undefined)
    odooApiCreateBusinessRequest.mockResolvedValue({ logged: true })
    isOdooApiV2Configured.mockReturnValue(false)
  })

  it('con Odoo disabilitato crea solo satellite locale senza account_welcome', async () => {
    await authService.register(
      { email: 'new@example.com', password: 'secret123', firstName: 'Ada' },
      'sess-1',
      'corr-1',
    )

    expect(assertOdooAuthReadyForIdentity).toHaveBeenCalled()
    expect(provisionOdooAuthIdentity).not.toHaveBeenCalled()
    expect(ensureSatelliteProjection).not.toHaveBeenCalled()
    expect(createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'new@example.com',
        passwordHash: expect.any(String),
      }),
    )
    expect(linkSessionToIdentity).toHaveBeenCalledWith(
      'sess-1',
      expect.objectContaining({ odooPartnerId: -1 }),
    )
    expect(sendPwaMail).not.toHaveBeenCalled()
  })

  it('con Odoo richiesto crea identità Odoo poi proiezione satellite (niente passwordHash)', async () => {
    isOdooAuthIdentityRequired.mockReturnValue(true)
    provisionOdooAuthIdentity.mockResolvedValue({
      odooPartnerId: 42,
      odooUserId: 7,
      portalCreated: true,
    })
    ensureSatelliteProjection.mockResolvedValue({
      id: 'u1',
      email: 'new@example.com',
      firstName: 'Ada',
      lastName: 'Lovelace',
      phone: null,
      companyName: null,
      vatNumber: null,
      odooPartnerId: 42,
    })

    await authService.register(
      { email: 'new@example.com', password: 'secret123', firstName: 'Ada', lastName: 'Lovelace' },
      'sess-1',
      'corr-1',
    )

    expect(provisionOdooAuthIdentity).toHaveBeenCalled()
    expect(ensureSatelliteProjection).toHaveBeenCalledWith(
      expect.objectContaining({
        odooPartnerId: 42,
        email: 'new@example.com',
        clearLocalPassword: true,
      }),
    )
    expect(createUser).not.toHaveBeenCalled()
    expect(findSatelliteByEmail).not.toHaveBeenCalled()
    expect(provisionOdooAuthIdentity.mock.invocationCallOrder[0]).toBeLessThan(
      ensureSatelliteProjection.mock.invocationCallOrder[0]!,
    )
    expect(linkSessionToIdentity).toHaveBeenCalledWith(
      'sess-1',
      expect.objectContaining({
        odooPartnerId: 42,
        odooUid: 7,
      }),
    )
    expect(odooApiCreateBusinessRequest).not.toHaveBeenCalled()
  })

  it('registrazione business chiama business-request su Odoo API v2', async () => {
    isOdooAuthIdentityRequired.mockReturnValue(true)
    isOdooApiV2Configured.mockReturnValue(true)
    provisionOdooAuthIdentity.mockResolvedValue({
      odooPartnerId: 42,
      odooUserId: 7,
      portalCreated: true,
    })
    ensureSatelliteProjection.mockResolvedValue({
      id: 'u1',
      email: 'biz@example.com',
      firstName: 'Ada',
      lastName: 'Lovelace',
      phone: null,
      companyName: 'Acme SRL',
      vatNumber: 'IT12345678901',
      odooPartnerId: 42,
    })

    await authService.register(
      {
        email: 'biz@example.com',
        password: 'secret123',
        firstName: 'Ada',
        lastName: 'Lovelace',
        customerSegment: 'business',
        companyName: 'Acme SRL',
        vatNumber: 'IT12345678901',
      },
      'sess-1',
      'corr-biz',
    )

    // fire-and-forget: attendi il microtask
    await vi.waitFor(() => {
      expect(odooApiCreateBusinessRequest).toHaveBeenCalled()
    })

    expect(odooApiCreateBusinessRequest).toHaveBeenCalledWith(
      42,
      expect.objectContaining({
        company_name: 'Acme SRL',
        vat: 'IT12345678901',
        email: 'biz@example.com',
      }),
      'corr-biz',
    )
    expect(sendPwaMail).not.toHaveBeenCalled()
  })

  it('fallisce senza satellite se Odoo identity fallisce', async () => {
    isOdooAuthIdentityRequired.mockReturnValue(true)
    provisionOdooAuthIdentity.mockRejectedValue(
      new AppError('ODOO_REGISTER_FAILED', 'fail', 'Non siamo riusciti.', 503, true),
    )

    await expect(
      authService.register(
        { email: 'new@example.com', password: 'secret123' },
        'sess-1',
        'corr-1',
      ),
    ).rejects.toMatchObject({ code: 'ODOO_REGISTER_FAILED' })

    expect(ensureSatelliteProjection).not.toHaveBeenCalled()
    expect(createUser).not.toHaveBeenCalled()
    expect(sendPwaMail).not.toHaveBeenCalled()
  })
})

describe('authService.login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isOdooAuthIdentityRequired.mockReturnValue(false)
  })

  it('con Odoo richiesto autentica solo via portal', async () => {
    isOdooAuthIdentityRequired.mockReturnValue(true)
    loginWithOdooCredentials.mockResolvedValue({ id: 'u1', email: 'a@b.it' })

    const result = await authService.login(
      { email: 'a@b.it', password: 'pw' },
      'sess-1',
      'corr-1',
    )

    expect(result).toEqual({ id: 'u1', email: 'a@b.it' })
    expect(loginWithOdooCredentials).toHaveBeenCalled()
    expect(findSatelliteByEmail).not.toHaveBeenCalled()
  })

  it('con Odoo richiesto rifiuta se portal auth fallisce (niente fallback bcrypt)', async () => {
    isOdooAuthIdentityRequired.mockReturnValue(true)
    loginWithOdooCredentials.mockResolvedValue(null)
    findSatelliteByEmail.mockResolvedValue({
      id: 'u1',
      email: 'a@b.it',
      passwordHash: bcrypt.hashSync('pw', 4),
    })

    await expect(
      authService.login({ email: 'a@b.it', password: 'pw' }, 'sess-1', 'corr-1'),
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' })

    expect(findSatelliteByEmail).not.toHaveBeenCalled()
  })

  it('con Odoo disabilitato usa bcrypt locale', async () => {
    const hash = bcrypt.hashSync('pw', 4)
    findSatelliteByEmail.mockResolvedValue({
      id: 'u1',
      email: 'a@b.it',
      passwordHash: hash,
      odooPartnerId: -1,
    })

    await authService.login({ email: 'a@b.it', password: 'pw' }, 'sess-1')

    expect(loginWithOdooCredentials).not.toHaveBeenCalled()
    expect(linkSessionToIdentity).toHaveBeenCalled()
  })
})
