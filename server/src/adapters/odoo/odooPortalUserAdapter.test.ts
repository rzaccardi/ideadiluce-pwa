import { beforeEach, describe, expect, it, vi } from 'vitest'

const { odooExecuteKw, envState, odooConfigured, apiV2Configured, odooApiAuthRegister } = vi.hoisted(
  () => ({
    odooExecuteKw: vi.fn(),
    envState: { ODOO_ENABLED: true },
    odooConfigured: { value: true },
    apiV2Configured: { value: false },
    odooApiAuthRegister: vi.fn(),
  }),
)

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

vi.mock('../odoo-api/odooApiClient.js', () => ({
  isOdooApiV2Configured: () => apiV2Configured.value,
  OdooApiV2Error: class OdooApiV2Error extends Error {
    constructor(
      message: string,
      public readonly httpStatus: number,
      public readonly body: unknown,
    ) {
      super(message)
      this.name = 'OdooApiV2Error'
    }
  },
}))

vi.mock('../odoo-api/odooApi.resources.js', () => ({
  odooApiAuthRegister: (...args: unknown[]) => odooApiAuthRegister(...args),
}))

import { ensureOdooPortalUser } from './odooPortalUserAdapter.js'

describe('ensureOdooPortalUser', () => {
  beforeEach(() => {
    odooExecuteKw.mockReset()
    odooApiAuthRegister.mockReset()
    envState.ODOO_ENABLED = true
    odooConfigured.value = true
    apiV2Configured.value = false
  })

  it('con API v2 crea il portal via POST /api/v2/auth/register', async () => {
    apiV2Configured.value = true
    odooExecuteKw.mockResolvedValueOnce([]) // find by email
    odooApiAuthRegister.mockResolvedValue({
      user_id: 40,
      login: 'nuovo@test.it',
      created: true,
    })

    const result = await ensureOdooPortalUser(
      { correlationId: 'portal-1' },
      {
        email: 'nuovo@test.it',
        partnerId: 5,
        name: 'Nuovo Cliente',
        password: 'secret-pass',
      },
    )

    expect(result).toEqual({ odooUserId: 40, created: true })
    expect(odooApiAuthRegister).toHaveBeenCalledWith(
      { customer_id: 5, password: 'secret-pass' },
      'portal-1',
    )
    expect(odooExecuteKw.mock.calls.some((c) => c[2] === 'create')).toBe(false)
  })

  it('senza API v2 crea il portal con no_reset_password via XML-RPC', async () => {
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
    expect(odooApiAuthRegister).not.toHaveBeenCalled()
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
