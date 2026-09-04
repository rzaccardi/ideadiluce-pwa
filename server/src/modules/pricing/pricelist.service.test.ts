import { beforeEach, describe, expect, it, vi } from 'vitest'

const odooExecuteKw = vi.fn()
const findUnique = vi.fn()

vi.mock('../../config/env.js', () => ({
  env: {
    ODOO_ENABLED: true,
    ODOO_PRICELIST_B2C_ID: 10,
    ODOO_PRICELIST_B2B_ID: 20,
    ODOO_PRICELIST_PROFESSIONAL_ID: 30,
  },
}))

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    odooCustomerMap: { findUnique: (...args: unknown[]) => findUnique(...args) },
  },
}))

vi.mock('../../adapters/odoo/odooClient.js', () => ({
  isOdooConfigured: () => true,
  odooExecuteKw: (...args: unknown[]) => odooExecuteKw(...args),
}))

import {
  isPersonalizedPricing,
  resolveAccountPricing,
  resolvePricingContext,
} from './pricelist.service.js'

describe('isPersonalizedPricing', () => {
  it('è falso per guest / retail senza partner', () => {
    expect(
      isPersonalizedPricing({
        segment: 'RETAIL',
        partnerId: null,
        pricelistId: 10,
        personalized: false,
      }),
    ).toBe(false)
  })

  it('è vero per B2B e per partner con listino dedicato', () => {
    expect(
      isPersonalizedPricing({
        segment: 'BUSINESS',
        partnerId: 99,
        pricelistId: 44,
        personalized: true,
      }),
    ).toBe(true)
  })
})

describe('resolveAccountPricing', () => {
  beforeEach(() => {
    odooExecuteKw.mockReset()
  })

  it('preferisce il listino del partner Odoo rispetto al fallback env B2B', async () => {
    odooExecuteKw.mockResolvedValueOnce([{ property_product_pricelist: [44, 'Rivenditori'] }])

    const pricing = await resolveAccountPricing({
      segment: 'BUSINESS',
      partnerId: 99002,
      correlationId: 'test',
    })

    expect(pricing.pricelistId).toBe(44)
    expect(pricing.personalized).toBe(true)
    expect(odooExecuteKw).toHaveBeenCalledWith(
      expect.anything(),
      'res.partner',
      'read',
      [[99002]],
      { fields: ['property_product_pricelist'] },
    )
  })

  it('usa user.odooPricelistId se assegnato in PWA', async () => {
    const pricing = await resolveAccountPricing({
      segment: 'BUSINESS',
      odooPricelistId: 77,
      partnerId: 99002,
    })

    expect(pricing.pricelistId).toBe(77)
    expect(odooExecuteKw).not.toHaveBeenCalled()
  })

  it('per guest resta sul listino retail env e non è personalizzato', async () => {
    const pricing = await resolveAccountPricing({ segment: 'RETAIL' })
    expect(pricing.pricelistId).toBe(10)
    expect(pricing.personalized).toBe(false)
    expect(pricing.partnerId).toBeNull()
  })
})

describe('resolvePricingContext', () => {
  beforeEach(() => {
    findUnique.mockReset()
    odooExecuteKw.mockReset()
  })

  it('non marca personalizzato un request senza utente', async () => {
    const pricing = await resolvePricingContext({ correlationId: 'anon' } as never)
    expect(pricing.personalized).toBe(false)
    expect(pricing.segment).toBe('RETAIL')
    expect(findUnique).not.toHaveBeenCalled()
  })

  it('risolve partner e listino dalla sessione utente', async () => {
    findUnique.mockResolvedValueOnce({ odooPartnerId: 99003 })
    odooExecuteKw.mockResolvedValueOnce([{ property_product_pricelist: [31, 'Installatori'] }])

    const pricing = await resolvePricingContext({
      correlationId: 'pro',
      sessionRecord: {
        user: {
          id: 'user-pro',
          customerSegment: 'PROFESSIONAL',
          odooPricelistId: null,
        },
      },
    } as never)

    expect(pricing.partnerId).toBe(99003)
    expect(pricing.pricelistId).toBe(31)
    expect(pricing.personalized).toBe(true)
  })
})
