import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  findUniqueByPartner,
  findUniqueByEmail,
  findUniqueById,
  createUser,
  updateUser,
  findFirstMap,
  upsertMap,
} = vi.hoisted(() => ({
  findUniqueByPartner: vi.fn(),
  findUniqueByEmail: vi.fn(),
  findUniqueById: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  findFirstMap: vi.fn(),
  upsertMap: vi.fn(),
}))

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    customerSatellite: {
      findUnique: vi.fn(async (args: { where: { odooPartnerId?: number; email?: string; id?: string } }) => {
        if (args.where.odooPartnerId != null) return findUniqueByPartner(args)
        if (args.where.email) return findUniqueByEmail(args)
        if (args.where.id) return findUniqueById(args)
        return null
      }),
      create: createUser,
      update: updateUser,
    },
    odooCustomerMap: {
      findFirst: findFirstMap,
      upsert: upsertMap,
    },
  },
}))

import { ensureSatelliteProjection } from './satellite-projection.service.js'

describe('ensureSatelliteProjection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    findUniqueByPartner.mockResolvedValue(null)
    findUniqueByEmail.mockResolvedValue(null)
    findFirstMap.mockResolvedValue(null)
    upsertMap.mockResolvedValue({})
  })

  it('crea satellite keyed da odooPartnerId senza passwordHash', async () => {
    createUser.mockResolvedValue({
      id: 'u1',
      email: 'a@b.it',
      odooPartnerId: 10,
      passwordHash: null,
    })

    const user = await ensureSatelliteProjection({
      odooPartnerId: 10,
      email: 'a@b.it',
      firstName: 'Ada',
      clearLocalPassword: true,
    })

    expect(createUser).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: 'a@b.it',
        odooPartnerId: 10,
        passwordHash: null,
        firstName: 'Ada',
      }),
    })
    expect(upsertMap).toHaveBeenCalled()
    expect(user.id).toBe('u1')
  })

  it('riaggancia orphan per email solo dopo partner Odoo noto', async () => {
    findUniqueByEmail.mockResolvedValue({
      id: 'orphan',
      email: 'a@b.it',
      odooPartnerId: -5,
      passwordHash: 'legacy',
    })
    updateUser.mockResolvedValue({
      id: 'orphan',
      email: 'a@b.it',
      odooPartnerId: 10,
      passwordHash: null,
    })

    await ensureSatelliteProjection({
      odooPartnerId: 10,
      email: 'a@b.it',
      clearLocalPassword: true,
    })

    expect(createUser).not.toHaveBeenCalled()
    expect(updateUser).toHaveBeenCalledWith({
      where: { id: 'orphan' },
      data: expect.objectContaining({
        odooPartnerId: 10,
        passwordHash: null,
      }),
    })
  })
})
