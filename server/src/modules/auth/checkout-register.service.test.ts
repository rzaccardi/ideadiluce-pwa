import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../../types/errors.js'

const {
  findSatelliteByEmail,
  createUser,
  provisionOdooAuthIdentity,
  assertOdooAuthReadyForIdentity,
  isOdooAuthIdentityRequired,
  ensureSatelliteProjection,
  establishLoggedInSession,
  sendPwaMail,
  findOdooPortalUserByEmail,
  prismaUserUpdate,
} = vi.hoisted(() => ({
  findSatelliteByEmail: vi.fn(),
  createUser: vi.fn(),
  provisionOdooAuthIdentity: vi.fn(),
  assertOdooAuthReadyForIdentity: vi.fn(),
  isOdooAuthIdentityRequired: vi.fn(() => false),
  ensureSatelliteProjection: vi.fn(),
  establishLoggedInSession: vi.fn(async () => ({ id: 'u1', email: 'c@example.com' })),
  sendPwaMail: vi.fn(),
  findOdooPortalUserByEmail: vi.fn(),
  prismaUserUpdate: vi.fn(),
}))

vi.mock('../../lib/prisma.js', () => ({
  prisma: { customerSatellite: { update: prismaUserUpdate } },
}))

vi.mock('./auth.repository.js', () => ({
  authRepository: {
    findSatelliteByEmail,
    findUserByEmail: findSatelliteByEmail,
    createUser,
  },
}))

vi.mock('./odoo-account-sync.service.js', () => ({
  provisionOdooAuthIdentity,
  assertOdooAuthReadyForIdentity,
  isOdooAuthIdentityRequired,
}))

vi.mock('./satellite-projection.service.js', () => ({
  ensureSatelliteProjection,
}))

vi.mock('./auth.service.js', () => ({
  authService: { establishLoggedInSession },
}))

vi.mock('../../adapters/odoo/odooPortalUserAdapter.js', () => ({
  findOdooPortalUserByEmail,
}))

vi.mock('../../adapters/odoo/odooMailAdapter.js', () => ({
  sendPwaMail,
}))

vi.mock('../../lib/mail.js', () => ({
  publicAppUrl: (path: string) => `https://shop.test${path}`,
}))

import { checkoutRegisterService } from './checkout-register.service.js'

describe('checkoutRegisterService.register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isOdooAuthIdentityRequired.mockReturnValue(false)
    findSatelliteByEmail.mockResolvedValue(null)
    createUser.mockResolvedValue({
      id: 'u1',
      email: 'c@example.com',
      firstName: 'Carlo',
    })
    sendPwaMail.mockResolvedValue(undefined)
    findOdooPortalUserByEmail.mockResolvedValue(null)
  })

  it('con Odoo richiesto provisioning poi satellite keyed da partner', async () => {
    isOdooAuthIdentityRequired.mockReturnValue(true)
    provisionOdooAuthIdentity.mockResolvedValue({
      odooPartnerId: 99,
      odooUserId: 3,
      portalCreated: true,
    })
    ensureSatelliteProjection.mockResolvedValue({
      id: 'u1',
      email: 'c@example.com',
      firstName: 'Carlo',
      odooPartnerId: 99,
    })

    await checkoutRegisterService.register(
      {
        email: 'c@example.com',
        password: 'secret123',
        firstName: 'Carlo',
        lastName: 'Rossi',
        phone: '333',
      },
      'sess-1',
      'corr-1',
    )

    expect(findOdooPortalUserByEmail).toHaveBeenCalled()
    expect(provisionOdooAuthIdentity).toHaveBeenCalledWith(
      { correlationId: 'corr-1' },
      expect.objectContaining({
        email: 'c@example.com',
        password: 'secret123',
        rejectExistingPortal: true,
      }),
    )
    expect(ensureSatelliteProjection).toHaveBeenCalledWith(
      expect.objectContaining({
        odooPartnerId: 99,
        email: 'c@example.com',
        clearLocalPassword: true,
      }),
    )
    expect(createUser).not.toHaveBeenCalled()
    expect(establishLoggedInSession).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: 'sess-1',
        odooPartnerId: 99,
        odooUid: 3,
      }),
    )
  })

  it('non crea satellite se Odoo fallisce', async () => {
    isOdooAuthIdentityRequired.mockReturnValue(true)
    provisionOdooAuthIdentity.mockRejectedValue(
      new AppError('ODOO_REGISTER_FAILED', 'fail', 'errore', 503, true),
    )

    await expect(
      checkoutRegisterService.register(
        {
          email: 'c@example.com',
          password: 'secret123',
          firstName: 'Carlo',
          lastName: 'Rossi',
          phone: '333',
        },
        'sess-1',
        'corr-1',
      ),
    ).rejects.toMatchObject({ code: 'ODOO_REGISTER_FAILED' })

    expect(ensureSatelliteProjection).not.toHaveBeenCalled()
    expect(createUser).not.toHaveBeenCalled()
  })

  it('se portal Odoo già esiste rifiuta (niente inventare account PWA)', async () => {
    isOdooAuthIdentityRequired.mockReturnValue(true)
    findOdooPortalUserByEmail.mockResolvedValue({
      odooUserId: 1,
      odooPartnerId: 11,
    })

    await expect(
      checkoutRegisterService.register(
        {
          email: 'c@example.com',
          password: 'secret123',
          firstName: 'Carlo',
          lastName: 'Rossi',
          phone: '333',
        },
        'sess-1',
        'corr-1',
      ),
    ).rejects.toMatchObject({ code: 'EMAIL_TAKEN' })

    expect(provisionOdooAuthIdentity).not.toHaveBeenCalled()
    expect(ensureSatelliteProjection).not.toHaveBeenCalled()
  })
})
