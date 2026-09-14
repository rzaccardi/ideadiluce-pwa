import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    pwaOrder: { update: vi.fn() },
  },
}))

vi.mock('../../lib/prisma.js', () => ({
  prisma: prismaMock,
}))

vi.mock('../../config/env.js', () => ({
  env: { PAID_SYNC_ALERT_EMAIL: '' },
}))

vi.mock('../../lib/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

vi.mock('../odoo/odooMailAdapter.js', () => ({
  sendPwaMail: vi.fn(),
  PWA_ADMIN_MAIL_TO: 'info@ideadiluce.com',
}))

import { persistOdooOrderLink } from './odooApi.sideEffects.js'

describe('persistOdooOrderLink', () => {
  beforeEach(() => {
    prismaMock.pwaOrder.update.mockReset()
    prismaMock.pwaOrder.update.mockResolvedValue({})
  })

  it('salva id numerico e codice ordine a 6 caratteri', async () => {
    await persistOdooOrderLink('ord-1', {
      odooSaleOrderId: 88,
      odooSaleOrderName: '4CSVKG',
      odooPartnerId: 12,
    })
    expect(prismaMock.pwaOrder.update).toHaveBeenCalledWith({
      where: { id: 'ord-1' },
      data: {
        odooSaleOrderId: 88,
        odooSaleOrderName: '4CSVKG',
        odooPartnerId: 12,
      },
    })
  })
})
