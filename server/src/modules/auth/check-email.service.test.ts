import { beforeEach, describe, expect, it, vi } from 'vitest'

const findOdooPortalUserByEmail = vi.hoisted(() => vi.fn())
const findSatelliteByEmail = vi.hoisted(() => vi.fn())
const isOdooAuthIdentityRequired = vi.hoisted(() => vi.fn(() => false))

vi.mock('../../adapters/odoo/odooPortalUserAdapter.js', () => ({
  findOdooPortalUserByEmail,
}))

vi.mock('./auth.repository.js', () => ({
  authRepository: {
    findSatelliteByEmail,
  },
}))

vi.mock('./odoo-account-sync.service.js', () => ({
  isOdooAuthIdentityRequired,
}))

import { checkEmailService } from './check-email.service.js'

describe('checkEmailService', () => {
  beforeEach(() => {
    findOdooPortalUserByEmail.mockReset()
    findSatelliteByEmail.mockReset()
    isOdooAuthIdentityRequired.mockReset()
    isOdooAuthIdentityRequired.mockReturnValue(false)
    findSatelliteByEmail.mockResolvedValue(null)
  })

  it('con Odoo richiesto: exists true se portal trovato', async () => {
    isOdooAuthIdentityRequired.mockReturnValue(true)
    findOdooPortalUserByEmail.mockResolvedValue({ odooUserId: 1, odooPartnerId: 2 })

    await expect(checkEmailService.checkEmail('User@Example.com', 'corr')).resolves.toEqual({
      exists: true,
    })
    expect(findOdooPortalUserByEmail).toHaveBeenCalledWith(
      { correlationId: 'corr' },
      'user@example.com',
    )
  })

  it('con Odoo richiesto: exists false se portal assente e satellite vuoto', async () => {
    isOdooAuthIdentityRequired.mockReturnValue(true)
    findOdooPortalUserByEmail.mockResolvedValue(null)
    findSatelliteByEmail.mockResolvedValue(null)

    await expect(checkEmailService.checkEmail('new@example.com', 'corr')).resolves.toEqual({
      exists: false,
    })
  })

  it('con Odoo off: exists true se satellite ha passwordHash', async () => {
    isOdooAuthIdentityRequired.mockReturnValue(false)
    findSatelliteByEmail.mockResolvedValue({ id: 'u1', passwordHash: 'hash', odooPartnerId: null })

    await expect(checkEmailService.checkEmail('local@example.com', 'corr')).resolves.toEqual({
      exists: true,
    })
    expect(findOdooPortalUserByEmail).not.toHaveBeenCalled()
  })

  it('con Odoo off: exists true se satellite ha odooPartnerId', async () => {
    isOdooAuthIdentityRequired.mockReturnValue(false)
    findSatelliteByEmail.mockResolvedValue({ id: 'u1', passwordHash: null, odooPartnerId: 99 })

    await expect(checkEmailService.checkEmail('mapped@example.com', 'corr')).resolves.toEqual({
      exists: true,
    })
  })

  it('con Odoo richiesto ma errore lookup: fallback satellite', async () => {
    isOdooAuthIdentityRequired.mockReturnValue(true)
    findOdooPortalUserByEmail.mockRejectedValue(new Error('odoo down'))
    findSatelliteByEmail.mockResolvedValue({ id: 'u1', passwordHash: 'x', odooPartnerId: null })

    await expect(checkEmailService.checkEmail('fallback@example.com', 'corr')).resolves.toEqual({
      exists: true,
    })
  })
})
