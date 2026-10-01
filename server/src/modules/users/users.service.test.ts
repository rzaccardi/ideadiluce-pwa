import { beforeEach, describe, expect, it, vi } from 'vitest'
import bcrypt from 'bcryptjs'
import { AppError } from '../../types/errors.js'

const {
  prismaUserFindUnique,
  prismaUserUpdate,
  prismaOdooMapFindUnique,
  updateCustomerProfile,
  updateOdooPortalUserLogin,
  toUserDTO,
  invalidateSessionCacheForSession,
} = vi.hoisted(() => ({
  prismaUserFindUnique: vi.fn(),
  prismaUserUpdate: vi.fn(),
  prismaOdooMapFindUnique: vi.fn(),
  updateCustomerProfile: vi.fn(),
  updateOdooPortalUserLogin: vi.fn(),
  toUserDTO: vi.fn(async (user: { id: string; email: string }) => user),
  invalidateSessionCacheForSession: vi.fn(),
}))

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    user: { findUnique: prismaUserFindUnique, update: prismaUserUpdate },
    odooCustomerMap: { findUnique: prismaOdooMapFindUnique },
  },
}))

vi.mock('../../adapters/odoo/odooCustomerAdapter.js', () => ({
  createOdooCustomerAdapter: () => ({
    updateCustomerProfile,
    updateCustomerBusiness: vi.fn(),
    syncProfessionalFlagFromPartner: vi.fn(),
    updateDeliveryPartner: vi.fn(),
  }),
}))

vi.mock('../../adapters/odoo/odooPortalUserAdapter.js', () => ({
  updateOdooPortalUserLogin,
}))

vi.mock('../../adapters/odoo/odooClient.js', () => ({
  isOdooConfigured: () => false,
}))

vi.mock('../../config/env.js', () => ({
  env: { ODOO_ENABLED: false },
}))

vi.mock('../../middlewares/session.js', () => ({
  invalidateSessionCacheForSession,
}))

vi.mock('./user.mapper.js', () => ({
  toUserDTO,
}))

vi.mock('./users-odoo-sync.helper.js', () => ({
  runOdooUserProfileSync: vi.fn(async (_ctx, _input, syncFn) => {
    await syncFn()
    return false
  }),
}))

vi.mock('../professional-account/professional-account.repository.js', () => ({
  professionalAccountRepository: { findLatestForAccount: vi.fn() },
}))

vi.mock('../tax/tax-validation.service.js', () => ({
  taxValidationService: { validate: vi.fn() },
}))

import { usersService } from './users.service.js'

describe('usersService.changePassword', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('aggiorna la password se quella attuale è corretta', async () => {
    const hash = bcrypt.hashSync('old-password', 4)
    prismaUserFindUnique.mockResolvedValue({ id: 'u1', passwordHash: hash })
    prismaUserUpdate.mockResolvedValue({ id: 'u1' })

    await usersService.changePassword('u1', {
      currentPassword: 'old-password',
      newPassword: 'new-password',
    })

    expect(prismaUserUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u1' },
        data: expect.objectContaining({ passwordHash: expect.any(String) }),
      }),
    )
    const nextHash = prismaUserUpdate.mock.calls[0][0].data.passwordHash as string
    expect(bcrypt.compareSync('new-password', nextHash)).toBe(true)
  })

  it('rifiuta password attuale errata', async () => {
    const hash = bcrypt.hashSync('old-password', 4)
    prismaUserFindUnique.mockResolvedValue({ id: 'u1', passwordHash: hash })

    await expect(
      usersService.changePassword('u1', {
        currentPassword: 'wrong',
        newPassword: 'new-password',
      }),
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' } satisfies Partial<AppError>)
  })
})

describe('usersService.patchMe email', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('aggiorna email se libera', async () => {
    prismaUserFindUnique
      .mockResolvedValueOnce({ id: 'u1', email: 'old@example.com' })
      .mockResolvedValueOnce(null)
    prismaUserUpdate.mockResolvedValue({ id: 'u1', email: 'new@example.com' })

    const result = await usersService.patchMe('u1', { email: 'new@example.com' })

    expect(prismaUserUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u1' },
        data: expect.objectContaining({ email: 'new@example.com' }),
      }),
    )
    expect(result.user).toEqual(expect.objectContaining({ email: 'new@example.com' }))
  })

  it('rifiuta email già in uso', async () => {
    prismaUserFindUnique
      .mockResolvedValueOnce({ id: 'u1', email: 'old@example.com' })
      .mockResolvedValueOnce({ id: 'u2', email: 'taken@example.com' })

    await expect(usersService.patchMe('u1', { email: 'taken@example.com' })).rejects.toMatchObject({
      code: 'EMAIL_TAKEN',
    } satisfies Partial<AppError>)
    expect(prismaUserUpdate).not.toHaveBeenCalled()
  })

  it('non riscrive email se invariata (solo case/spazi)', async () => {
    prismaUserFindUnique.mockResolvedValueOnce({ id: 'u1', email: 'same@example.com' })
    prismaUserUpdate.mockResolvedValue({ id: 'u1', email: 'same@example.com', firstName: 'Ada' })

    await usersService.patchMe('u1', { email: '  Same@Example.com  ', firstName: 'Ada' })

    expect(prismaUserFindUnique).toHaveBeenCalledTimes(1)
    expect(prismaUserUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.not.objectContaining({ email: expect.anything() }),
      }),
    )
  })
})
