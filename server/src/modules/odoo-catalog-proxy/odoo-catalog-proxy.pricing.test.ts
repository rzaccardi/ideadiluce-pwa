import { describe, expect, it, vi } from 'vitest'
import type { Request } from 'express'
import { resolvePricingContext } from '../pricing/pricelist.service.js'
import { catalogProxyPricingQuery, stripClientPricingParams } from './odoo-catalog-proxy.pricing.js'

vi.mock('../pricing/pricelist.service.js', () => ({
  resolvePricingContext: vi.fn(),
}))

describe('stripClientPricingParams', () => {
  it('rimuove partner, listino e website dalla query', () => {
    expect(
      stripClientPricingParams({
        locale: 'IT',
        partner_id: '99',
        pricelist_id: '7',
        website: '3',
        q: 'lampada',
      }),
    ).toEqual({ locale: 'IT', q: 'lampada' })
  })
})

describe('catalogProxyPricingQuery', () => {
  it('ignora i parametri client e inietta solo il contesto di sessione', async () => {
    vi.mocked(resolvePricingContext).mockResolvedValue({
      segment: 'BUSINESS',
      partnerId: 12,
      pricelistId: 4,
    })

    const result = await catalogProxyPricingQuery({} as Request, {
      partner_id: '9999',
      pricelist_id: '8888',
      website: '1',
      locale: 'IT',
    })

    expect(result).toEqual({
      locale: 'IT',
      partner_id: '12',
      pricelist_id: '4',
    })
  })

  it('non espone listino se la sessione è anonima', async () => {
    vi.mocked(resolvePricingContext).mockResolvedValue({
      segment: 'RETAIL',
      partnerId: null,
      pricelistId: null,
    })

    const result = await catalogProxyPricingQuery({} as Request, {
      pricelist_id: '4',
      partner_id: '12',
    })

    expect(result.partner_id).toBeUndefined()
    expect(result.pricelist_id).toBeUndefined()
  })
})
