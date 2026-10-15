import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  requestOdooPasswordReset,
  isOdooAuthIdentityRequired,
  syncPasswordToOdooPortal,
  isEmergencyMode,
  prismaUserFindUnique,
  prismaPasswordResetCreate,
  sendPwaMail,
} = vi.hoisted(() => ({
  requestOdooPasswordReset: vi.fn(),
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
  requestOdooPasswordReset,
}))

vi.mock('./odoo-account-sync.service.js', () => ({
  ensureSatelliteFromOdooPortal: vi.fn(),
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

  it('con Odoo attivo preferisce reset nativo e non invia mail PWA se sent', async () => {
    isOdooAuthIdentityRequired.mockReturnValue(true)
    requestOdooPasswordReset.mockResolvedValue('sent')

    await passwordResetService.requestReset('a@b.it', 'corr-1')

    expect(requestOdooPasswordReset).toHaveBeenCalled()
    expect(sendPwaMail).not.toHaveBeenCalled()
    expect(prismaPasswordResetCreate).not.toHaveBeenCalled()
  })

  it('con Odoo attivo non fa fallback su User locale se portal non trovato', async () => {
    isOdooAuthIdentityRequired.mockReturnValue(true)
    requestOdooPasswordReset.mockResolvedValue('not_found')
    prismaUserFindUnique.mockResolvedValue({ id: 'u1', email: 'a@b.it' })

    await passwordResetService.requestReset('a@b.it', 'corr-1')

    expect(prismaPasswordResetCreate).not.toHaveBeenCalled()
    expect(sendPwaMail).not.toHaveBeenCalled()
  })

  it('con Odoo disabilitato usa reset PWA su satellite esistente', async () => {
    prismaUserFindUnique.mockResolvedValue({ id: 'u1', email: 'a@b.it' })
    prismaPasswordResetCreate.mockResolvedValue({})
    sendPwaMail.mockResolvedValue(undefined)

    await passwordResetService.requestReset('a@b.it', 'corr-1')

    expect(requestOdooPasswordReset).not.toHaveBeenCalled()
    expect(prismaPasswordResetCreate).toHaveBeenCalled()
    expect(sendPwaMail).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ templateKey: 'password_reset' }),
    )
  })
})
