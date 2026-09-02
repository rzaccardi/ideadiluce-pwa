import { beforeEach, describe, expect, it, vi } from 'vitest'

const { odooXmlRpcVersion, envState, emergency } = vi.hoisted(() => ({
  odooXmlRpcVersion: vi.fn(),
  envState: { ODOO_ENABLED: true, ODOO_CHECKOUT_REQUIRE_LIVE: false },
  emergency: { value: false },
}))

vi.mock('../config/env.js', () => ({ env: envState }))
vi.mock('./integration-log.js', () => ({ writeIntegrationLog: vi.fn() }))
vi.mock('../modules/odoo/odoo-resilience.settings.js', () => ({
  isEmergencyMode: async () => emergency.value,
}))
vi.mock('../adapters/odoo/odooClient.js', () => ({
  isOdooConfigured: () => true,
  odooXmlRpcVersion: (...args: unknown[]) => odooXmlRpcVersion(...args),
}))

import { AppError } from '../types/errors.js'
import { assertOdooReadyForCheckout } from './odoo-checkout-health.js'

describe('assertOdooReadyForCheckout', () => {
  beforeEach(() => {
    odooXmlRpcVersion.mockReset()
    envState.ODOO_ENABLED = true
    envState.ODOO_CHECKOUT_REQUIRE_LIVE = false
    emergency.value = false
  })

  it('fail-open: se Odoo è giù e REQUIRE_LIVE è false non lancia', async () => {
    odooXmlRpcVersion.mockRejectedValue(new Error('timeout'))
    await expect(
      assertOdooReadyForCheckout({ correlationId: 't' }, { step: 'lock' }),
    ).resolves.toBeUndefined()
  })

  it('in modalità emergenza non pinga Odoo', async () => {
    emergency.value = true
    await assertOdooReadyForCheckout({ correlationId: 't' }, { step: 'lock' })
    expect(odooXmlRpcVersion).not.toHaveBeenCalled()
  })

  it('se REQUIRE_LIVE è true e Odoo è giù lancia 503', async () => {
    envState.ODOO_CHECKOUT_REQUIRE_LIVE = true
    odooXmlRpcVersion.mockRejectedValue(new Error('timeout'))
    await expect(
      assertOdooReadyForCheckout({ correlationId: 't' }, { step: 'lock' }),
    ).rejects.toMatchObject({ code: 'ODOO_UNAVAILABLE', statusCode: 503 } satisfies Partial<AppError>)
  })
})
