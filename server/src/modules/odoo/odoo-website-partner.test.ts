import { describe, expect, it, vi } from 'vitest'

const apiV2 = vi.hoisted(() => ({ value: true }))

vi.mock('../../adapters/odoo-api/odooApiClient.js', () => ({
  isOdooApiV2Configured: () => apiV2.value,
}))

import { isWebsitePartnerUsable } from './odoo-website-partner.js'

describe('isWebsitePartnerUsable', () => {
  const ctx = { correlationId: 'test' }

  it('rifiuta id assente', async () => {
    const adapter = { getCustomerAccountByPartnerId: vi.fn() }
    expect(await isWebsitePartnerUsable(ctx, adapter, null)).toBe(false)
    expect(adapter.getCustomerAccountByPartnerId).not.toHaveBeenCalled()
  })

  it('con API v2 accetta solo partner visibili sul website', async () => {
    const adapter = {
      getCustomerAccountByPartnerId: vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce({ contactPartnerId: 44 }),
    }
    expect(await isWebsitePartnerUsable(ctx, adapter, 11913)).toBe(false)
    expect(await isWebsitePartnerUsable(ctx, adapter, 44)).toBe(true)
  })

  it('senza API v2 considera valido qualsiasi id positivo', async () => {
    apiV2.value = false
    const adapter = { getCustomerAccountByPartnerId: vi.fn() }
    expect(await isWebsitePartnerUsable(ctx, adapter, 11913)).toBe(true)
    expect(adapter.getCustomerAccountByPartnerId).not.toHaveBeenCalled()
    apiV2.value = true
  })
})
