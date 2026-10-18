import { beforeEach, describe, expect, it, vi } from 'vitest'

const { odooExecuteKw, envState, odooConfigured } = vi.hoisted(() => ({
  odooExecuteKw: vi.fn(),
  envState: { ODOO_ENABLED: true },
  odooConfigured: { value: true },
}))

vi.mock('../../config/env.js', () => ({
  env: envState,
}))

vi.mock('../../lib/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

vi.mock('./odooClient.js', () => ({
  isOdooConfigured: () => odooConfigured.value,
  odooExecuteKw: (...args: unknown[]) => odooExecuteKw(...args),
}))

import { ensureOdooPortalUser } from './odooPortalUserAdapter.js'

describe('ensureOdooPortalUser', () => {
  beforeEach(() => {
    odooExecuteKw.mockReset()
    envState.ODOO_ENABLED = true
    odooConfigured.value = true
  })

  it('crea il portal con no_reset_password per non inviare la mail nativa Odoo', async () => {
    odooExecuteKw
      .mockResolvedValueOnce([]) // find by email
      .mockResolvedValueOnce(['base', 12]) // group_portal ref
      .mockResolvedValueOnce(77) // create

    const result = await ensureOdooPortalUser(
      { correlationId: 'portal-1' },
      {
        email: 'nuovo@test.it',
        partnerId: 5,
        name: 'Nuovo Cliente',
        password: 'secret-pass',
      },
    )

    expect(result).toEqual({ odooUserId: 77, created: true })
    expect(odooExecuteKw.mock.calls[2]?.[1]).toBe('res.users')
    expect(odooExecuteKw.mock.calls[2]?.[2]).toBe('create')
    expect(odooExecuteKw.mock.calls[2]?.[3]?.[0]).toMatchObject({
      login: 'nuovo@test.it',
      email: 'nuovo@test.it',
      partner_id: 5,
      password: 'secret-pass',
    })
    expect(odooExecuteKw.mock.calls[2]?.[4]).toEqual({
      context: { no_reset_password: true },
    })
  })
})
