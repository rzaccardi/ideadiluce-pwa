import { beforeEach, describe, expect, it, vi } from 'vitest'
import { OdooApiV2Error } from '../odoo-api/odooApiClient.js'

const { registerPaymentMock, alertConflict, prismaMock, apiV2 } = vi.hoisted(() => ({
  registerPaymentMock: vi.fn(),
  alertConflict: vi.fn(),
  prismaMock: {
    pwaOrder: { findUnique: vi.fn() },
  },
  apiV2: { value: true },
}))

vi.mock('../../config/env.js', () => ({
  env: { ODOO_ENABLED: true },
}))

vi.mock('../../lib/prisma.js', () => ({
  prisma: prismaMock,
}))

vi.mock('../odoo-api/odooApiClient.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../odoo-api/odooApiClient.js')>()
  return {
    ...actual,
    isOdooApiV2Configured: () => apiV2.value,
  }
})

vi.mock('../odoo-api/odooApi.resources.js', () => ({
  odooApiRegisterPayment: (...args: unknown[]) => registerPaymentMock(...args),
}))

vi.mock('../odoo-api/odooApi.sideEffects.js', () => ({
  alertOdooPaymentConflict: (...args: unknown[]) => alertConflict(...args),
}))

vi.mock('./odooFunnelSync.js', () => ({
  syncSaleOrderFunnelState: vi.fn(),
}))

import { registerPayment } from './odooPaymentLive.js'

describe('registerPayment API v2', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    apiV2.value = true
    prismaMock.pwaOrder.findUnique.mockResolvedValue({ odooSaleOrderName: '4CSVKG' })
  })

  it('POST /payments 201 con provider card e riferimento Stripe', async () => {
    registerPaymentMock.mockResolvedValue({
      status: 201,
      data: { order_state: 'sale', transaction_state: 'done', order_name: '4CSVKG' },
    })

    const result = await registerPayment(
      { correlationId: 'stripe-wh' },
      {
        saleOrderId: 88,
        pwaOrderId: 'ord-1',
        method: 'stripe',
        amountCents: 12900,
        transactionId: 'pi_abc',
        status: 'captured',
      },
    )

    expect(result).toBe('synced')
    expect(registerPaymentMock).toHaveBeenCalledWith(
      88,
      {
        provider: 'card',
        amount_cents: 12900,
        currency: 'EUR',
        provider_reference: 'pi_abc',
      },
      'stripe-wh',
    )
  })

  it('409 importo diverso: alert admin e failed', async () => {
    registerPaymentMock.mockRejectedValue(new OdooApiV2Error('amount mismatch', 409, { reconciliation: { diff_cents: 12 } }))

    const result = await registerPayment(
      { correlationId: 'stripe-wh' },
      {
        saleOrderId: 88,
        pwaOrderId: 'ord-1',
        method: 'stripe',
        amountCents: 100,
        transactionId: 'pi_abc',
        status: 'captured',
      },
    )

    expect(result).toBe('failed')
    expect(alertConflict).toHaveBeenCalledWith(
      expect.objectContaining({
        pwaOrderId: 'ord-1',
        odooSaleOrderId: 88,
        odooSaleOrderName: '4CSVKG',
        amountCents: 100,
      }),
    )
  })
})
