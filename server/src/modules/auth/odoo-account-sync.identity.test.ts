import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../../types/errors.js'

const envState = vi.hoisted(() => ({ ODOO_ENABLED: true }))
const findOrCreateCustomer = vi.hoisted(() => vi.fn())
const findOdooPortalUserByEmail = vi.hoisted(() => vi.fn())
const ensureOdooPortalUser = vi.hoisted(() => vi.fn())
const isOdooConfigured = vi.hoisted(() => vi.fn(() => true))
const odooAuthenticatePortalUser = vi.hoisted(() => vi.fn())
const getCustomerAccountByEmail = vi.hoisted(() => vi.fn())
const findCustomerByEmail = vi.hoisted(() => vi.fn())
const ensureSatelliteProjection = vi.hoisted(() => vi.fn())
const establishLoggedInSession = vi.hoisted(() => vi.fn())

vi.mock('../../config/env.js', () => ({
  get env() {
    return envState
  },
}))

vi.mock('../../adapters/odoo/odooClient.js', () => ({
  isOdooConfigured: () => isOdooConfigured(),
  odooAuthenticatePortalUser: (...args: unknown[]) => odooAuthenticatePortalUser(...args),
}))

vi.mock('../../adapters/odoo/odooCustomerAdapter.js', () => ({
  createOdooCustomerAdapter: () => ({
    findOrCreateCustomer,
    getCustomerAccountByEmail,
    findCustomerByEmail,
    getCustomerAccountByPartnerId: vi.fn(),
  }),
}))

vi.mock('../../adapters/odoo/odooPortalUserAdapter.js', () => ({
  findOdooPortalUserByEmail,
  ensureOdooPortalUser,
}))

vi.mock('../../adapters/odoo/odooMailAdapter.js', () => ({
  sendPwaMail: vi.fn(),
}))

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    odooCustomerMap: { upsert: vi.fn() },
    customerSatellite: { update: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
  },
}))

vi.mock('./auth.repository.js', () => ({
  authRepository: {
    findUserByEmail: vi.fn(),
    createUser: vi.fn(),
    linkSessionToUser: vi.fn(),
    linkSessionToIdentity: vi.fn(),
  },
}))

vi.mock('./auth.service.js', () => ({
  authService: {
    loginByVerifiedEmail: vi.fn(),
    establishLoggedInSession,
  },
  mergeCartsForUser: vi.fn(),
  sessionExpiry: () => new Date(),
}))

vi.mock('./satellite-projection.service.js', () => ({
  ensureSatelliteProjection,
}))

vi.mock('../users/users-odoo-business-hydrate.js', () => ({
  hydrateUserBusinessFromOdoo: vi.fn(async (u: unknown) => u),
}))

import {
  assertOdooAuthReadyForIdentity,
  isOdooAuthIdentityRequired,
  loginWithOdooCredentials,
  provisionOdooAuthIdentity,
  syncPasswordToOdooPortal,
} from './odoo-account-sync.service.js'

describe('Odoo auth identity helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    envState.ODOO_ENABLED = true
    isOdooConfigured.mockReturnValue(true)
  })

  it('isOdooAuthIdentityRequired richiede ODOO_ENABLED + XML-RPC', () => {
    expect(isOdooAuthIdentityRequired()).toBe(true)
    envState.ODOO_ENABLED = false
    expect(isOdooAuthIdentityRequired()).toBe(false)
  })

  it('assertOdooAuthReadyForIdentity fallisce se ODOO_ENABLED senza XML-RPC', () => {
    isOdooConfigured.mockReturnValue(false)
    expect(() => assertOdooAuthReadyForIdentity()).toThrow(
      expect.objectContaining({ code: 'ODOO_MISCONFIGURED' }),
    )
  })

  it('provisionOdooAuthIdentity rifiuta portal già esistente', async () => {
    findOdooPortalUserByEmail.mockResolvedValue({ odooUserId: 1, odooPartnerId: 2 })

    await expect(
      provisionOdooAuthIdentity(
        { correlationId: 'c1' },
        { email: 'a@b.it', password: 'pw', firstName: 'A' },
      ),
    ).rejects.toMatchObject({ code: 'EMAIL_TAKEN' } satisfies Partial<AppError>)

    expect(findOrCreateCustomer).not.toHaveBeenCalled()
  })

  it('provisionOdooAuthIdentity crea partner + portal', async () => {
    findOdooPortalUserByEmail.mockResolvedValue(null)
    findOrCreateCustomer.mockResolvedValue({ odooPartnerId: 50 })
    ensureOdooPortalUser.mockResolvedValue({ odooUserId: 9, created: true })

    const result = await provisionOdooAuthIdentity(
      { correlationId: 'c1' },
      { email: 'a@b.it', password: 'secret', firstName: 'Ada', lastName: 'L' },
    )

    expect(result).toEqual({ odooPartnerId: 50, odooUserId: 9, portalCreated: true })
    expect(ensureOdooPortalUser).toHaveBeenCalledWith(
      { correlationId: 'c1' },
      expect.objectContaining({
        email: 'a@b.it',
        partnerId: 50,
        password: 'secret',
      }),
    )
  })

  it('syncPasswordToOdooPortal aggiorna password se portal esiste', async () => {
    findOdooPortalUserByEmail.mockResolvedValue({ odooUserId: 1, odooPartnerId: 2 })
    ensureOdooPortalUser.mockResolvedValue({ odooUserId: 1, created: false })

    await expect(syncPasswordToOdooPortal({ correlationId: 'c1' }, 'a@b.it', 'newpw')).resolves.toBe(
      true,
    )
    expect(ensureOdooPortalUser).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ password: 'newpw', partnerId: 2 }),
    )
  })

  it('loginWithOdooCredentials fail-closed se auth ok ma partner assente', async () => {
    odooAuthenticatePortalUser.mockResolvedValue(99)
    getCustomerAccountByEmail.mockResolvedValue(null)
    findCustomerByEmail.mockResolvedValue(null)
    findOdooPortalUserByEmail.mockResolvedValue(null)

    await expect(
      loginWithOdooCredentials({ correlationId: 'c1' }, 'a@b.it', 'pw', 'sess-1'),
    ).resolves.toBeNull()

    expect(ensureSatelliteProjection).not.toHaveBeenCalled()
    expect(establishLoggedInSession).not.toHaveBeenCalled()
  })

  it('loginWithOdooCredentials crea solo satellite dopo auth+partner', async () => {
    odooAuthenticatePortalUser.mockResolvedValue(99)
    getCustomerAccountByEmail.mockResolvedValue({
      contactPartnerId: 50,
      profile: { firstName: 'Ada', lastName: 'L', phone: null },
    })
    ensureSatelliteProjection.mockResolvedValue({
      id: 'u1',
      email: 'a@b.it',
      odooPartnerId: 50,
    })
    establishLoggedInSession.mockResolvedValue({ id: 'u1', email: 'a@b.it' })

    const result = await loginWithOdooCredentials(
      { correlationId: 'c1' },
      'a@b.it',
      'pw',
      'sess-1',
    )

    expect(ensureSatelliteProjection).toHaveBeenCalledWith(
      expect.objectContaining({
        odooPartnerId: 50,
        email: 'a@b.it',
        clearLocalPassword: true,
      }),
    )
    expect(establishLoggedInSession).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: 'sess-1',
        odooPartnerId: 50,
        odooUid: 99,
      }),
    )
    expect(result).toEqual({ id: 'u1', email: 'a@b.it' })
  })
})
