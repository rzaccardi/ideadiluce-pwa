import { beforeEach, describe, expect, it, vi } from 'vitest'
import { OdooApiV2Error } from '../../adapters/odoo-api/odooApiClient.js'
import { AppError } from '../../types/errors.js'

const { odooApiPasswordReset, odooApiPasswordResetConfirm, isOdooApiV2Configured } = vi.hoisted(
  () => ({
    odooApiPasswordReset: vi.fn(),
    odooApiPasswordResetConfirm: vi.fn(),
    isOdooApiV2Configured: vi.fn(() => true),
  }),
)

vi.mock('../../adapters/odoo-api/odooApiClient.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../adapters/odoo-api/odooApiClient.js')>()
  return {
    ...actual,
    isOdooApiV2Configured,
  }
})

vi.mock('../../adapters/odoo-api/odooApi.resources.js', () => ({
  odooApiPasswordReset,
  odooApiPasswordResetConfirm,
}))

vi.mock('../../lib/mail.js', () => ({
  publicAppUrl: (path: string) => `https://shop.test${path}`,
}))

import { passwordResetService } from './password-reset.service.js'

describe('passwordResetService.requestReset', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isOdooApiV2Configured.mockReturnValue(true)
  })

  it('inoltra a Odoo password-reset con return_url localizzato', async () => {
    odooApiPasswordReset.mockResolvedValue({ accepted: true })

    await passwordResetService.requestReset('A@B.it', 'corr-1', 'EN')

    expect(odooApiPasswordReset).toHaveBeenCalledWith(
      {
        email: 'a@b.it',
        return_url: 'https://shop.test/en/reset-password',
      },
      'corr-1',
    )
  })

  it('con IT usa /reset-password senza prefisso', async () => {
    odooApiPasswordReset.mockResolvedValue({ accepted: true })

    await passwordResetService.requestReset('a@b.it', 'corr-1', 'IT')

    expect(odooApiPasswordReset).toHaveBeenCalledWith(
      expect.objectContaining({ return_url: 'https://shop.test/reset-password' }),
      'corr-1',
    )
  })

  it('503 se API v2 non configurata', async () => {
    isOdooApiV2Configured.mockReturnValue(false)

    await expect(passwordResetService.requestReset('a@b.it')).rejects.toMatchObject({
      code: 'ODOO_API_UNAVAILABLE',
      statusCode: 503,
    })
    expect(odooApiPasswordReset).not.toHaveBeenCalled()
  })
})

describe('passwordResetService.resetPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isOdooApiV2Configured.mockReturnValue(true)
  })

  it('inoltra token opaco a Odoo confirm e restituisce email', async () => {
    odooApiPasswordResetConfirm.mockResolvedValue({
      customer_id: 99,
      email: 'a@b.it',
      password_set: true,
      user_created: false,
    })

    const result = await passwordResetService.resetPassword('odoo-opaque-token', 'secret123', 'corr-2')

    expect(odooApiPasswordResetConfirm).toHaveBeenCalledWith(
      { token: 'odoo-opaque-token', password: 'secret123' },
      'corr-2',
    )
    expect(result).toEqual({ email: 'a@b.it', customerId: 99 })
  })

  it('mappa 400 field=token → INVALID_RESET_TOKEN', async () => {
    odooApiPasswordResetConfirm.mockRejectedValue(
      new OdooApiV2Error('Token non valido o scaduto', 400, { field: 'token' }),
    )

    await expect(
      passwordResetService.resetPassword('bad', 'secret123', 'corr-3'),
    ).rejects.toBeInstanceOf(AppError)

    try {
      await passwordResetService.resetPassword('bad', 'secret123', 'corr-3')
    } catch (e) {
      expect(e).toMatchObject({ code: 'INVALID_RESET_TOKEN', statusCode: 400 })
    }
  })

  it('mappa 400 field=password → VALIDATION_ERROR', async () => {
    odooApiPasswordResetConfirm.mockRejectedValue(
      new OdooApiV2Error('too short', 400, { field: 'password' }),
    )

    try {
      await passwordResetService.resetPassword('tok', 'short', 'corr-4')
      expect.fail('should throw')
    } catch (e) {
      expect(e).toMatchObject({ code: 'VALIDATION_ERROR', statusCode: 400 })
    }
  })
})
