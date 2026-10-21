import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  ensureSatelliteFromOdooPortal,
  isOdooAuthIdentityRequired,
  syncPasswordToOdooPortal,
  isEmergencyMode,
  prismaUserFindUnique,
  prismaPasswordResetCreate,
  sendPwaMail,
} = vi.hoisted(() => ({
  ensureSatelliteFromOdooPortal: vi.fn(),
  isOdooAuthIdentityRequired: vi.fn(() => false),
  syncPasswordToOdooPortal: vi.fn(),
  isEmergencyMode: vi.fn(async () => false),
  prismaUserFindUnique: vi.fn(),
  prismaPasswordResetCreate: vi.fn(),
  sendPwaMail: vi.fn(),
}))

vi.mock('../../config/env.js', () => ({
  env: { PASSWORD_RESET_TOKEN_HOURS: 2 },
}))

vi.mock('../../adapters/odoo/odooPortalUserAdapter.js', () => ({
  requestOdooPasswordReset: vi.fn(),
}))

vi.mock('./odoo-account-sync.service.js', () => ({
  ensureSatelliteFromOdooPortal,
  ensurePwaUserStubFromOdoo: vi.fn(),
  isOdooAuthIdentityRequired,
  syncPasswordToOdooPortal,
}))

vi.mock('../odoo/odoo-resilience.settings.js', () => ({
  isEmergencyMode,
}))

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    customerSatellite: { findUnique: prismaUserFindUnique },
    passwordResetToken: {
      create: prismaPasswordResetCreate,
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock('../../adapters/odoo/odooMailAdapter.js', () => ({
  sendPwaMail,
}))

vi.mock('../../lib/mail.js', () => ({
  publicAppUrl: (path: string) => `https://shop.test${path}`,
}))

import { passwordResetService } from './password-reset.service.js'

describe('passwordResetService.requestReset', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isOdooAuthIdentityRequired.mockReturnValue(false)
    isEmergencyMode.mockResolvedValue(false)
  })

  it('con Odoo attivo proietta satellite e invia mail PWA con reset_url', async () => {
    isOdooAuthIdentityRequired.mockReturnValue(true)
    prismaUserFindUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ odooPartnerId: 9, email: 'a@b.it' })
    ensureSatelliteFromOdooPortal.mockResolvedValue(true)
    prismaPasswordResetCreate.mockResolvedValue({})
    sendPwaMail.mockResolvedValue(undefined)

    await passwordResetService.requestReset('a@b.it', 'corr-1')

    expect(ensureSatelliteFromOdooPortal).toHaveBeenCalled()
    expect(prismaPasswordResetCreate).toHaveBeenCalled()
    expect(sendPwaMail).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        templateKey: 'password_reset',
        vars: expect.objectContaining({
          reset_url: expect.stringMatching(/^https:\/\/shop\.test\/reset-password\?token=/),
        }),
      }),
    )
  })

  it('con Odoo attivo non invia mail se portal non trovato', async () => {
    isOdooAuthIdentityRequired.mockReturnValue(true)
    prismaUserFindUnique.mockResolvedValue(null)
    ensureSatelliteFromOdooPortal.mockResolvedValue(false)

    await passwordResetService.requestReset('a@b.it', 'corr-1')

    expect(prismaPasswordResetCreate).not.toHaveBeenCalled()
    expect(sendPwaMail).not.toHaveBeenCalled()
  })

  it('con Odoo disabilitato usa reset PWA su satellite esistente', async () => {
    prismaUserFindUnique.mockResolvedValue({ odooPartnerId: 1, email: 'a@b.it' })
    prismaPasswordResetCreate.mockResolvedValue({})
    sendPwaMail.mockResolvedValue(undefined)

    await passwordResetService.requestReset('a@b.it', 'corr-1')

    expect(ensureSatelliteFromOdooPortal).not.toHaveBeenCalled()
    expect(prismaPasswordResetCreate).toHaveBeenCalled()
    expect(sendPwaMail).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ templateKey: 'password_reset' }),
    )
  })
})
