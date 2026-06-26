import { describe, expect, it, vi } from 'vitest'
import { runOdooUserProfileSync } from './users-odoo-sync.helper.js'

vi.mock('../../lib/integration-log.js', () => ({
  writeIntegrationLog: vi.fn().mockResolvedValue(undefined),
}))

describe('runOdooUserProfileSync', () => {
  const ctx = { correlationId: 'test-corr' }

  it('returns false when sync succeeds', async () => {
    const failed = await runOdooUserProfileSync(
      ctx,
      { userId: 'u1', partnerId: 42, operation: 'patch_me_profile_sync' },
      async () => {},
    )
    expect(failed).toBe(false)
  })

  it('returns true and logs when sync throws', async () => {
    const failed = await runOdooUserProfileSync(
      ctx,
      { userId: 'u1', partnerId: 42, operation: 'patch_me_business_sync' },
      async () => {
        throw new Error('Odoo unavailable')
      },
    )
    expect(failed).toBe(true)
  })
})
