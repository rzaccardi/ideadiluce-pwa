import { describe, expect, it } from 'vitest'
import { asApiItems, OdooApiV2Error, odooApiWebsiteQuery, toOdooApiV2AppError } from './odooApiClient.js'

describe('asApiItems', () => {
  it('accetta array, items, orders', () => {
    expect(asApiItems([{ id: 1 }])).toEqual([{ id: 1 }])
    expect(asApiItems({ items: [{ id: 2 }] })).toEqual([{ id: 2 }])
    expect(asApiItems({ orders: [{ id: 3 }] })).toEqual([{ id: 3 }])
    expect(asApiItems(null)).toEqual([])
  })
})

describe('toOdooApiV2AppError', () => {
  it('mappa 409 e 422', () => {
    const conflict = toOdooApiV2AppError(new OdooApiV2Error('mismatch', 409, { reconciliation: {} }), 'c1')
    expect(conflict.code).toBe('ODOO_API_CONFLICT')
    expect(conflict.statusCode).toBe(409)
    const validation = toOdooApiV2AppError(new OdooApiV2Error('CAP errato', 422, null), 'c1')
    expect(validation.code).toBe('ODOO_API_VALIDATION')
    expect(validation.statusCode).toBe(422)
  })
})

describe('odooApiWebsiteQuery', () => {
  it('invia un website numerico', () => {
    expect(odooApiWebsiteQuery().website).toMatch(/^\d+$/)
  })
})
