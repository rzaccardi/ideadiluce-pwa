import { describe, expect, it } from 'vitest'
import {
  buildPwaOrderSearchWhere,
  odooListSearchTerm,
  parseAdminOrdersSearch,
} from './orders-admin.search.js'

describe('parseAdminOrdersSearch', () => {
  it('riconosce il numero thank-you IDL', () => {
    expect(parseAdminOrdersSearch('#IDL-2026-09568')).toEqual({
      term: '#IDL-2026-09568',
      odooSaleOrderId: 9568,
      pwaOrderId: null,
    })
    expect(parseAdminOrdersSearch('IDL-2026-09568').odooSaleOrderId).toBe(9568)
  })

  it('riconosce id Odoo e id PWA', () => {
    expect(parseAdminOrdersSearch('#9568').odooSaleOrderId).toBe(9568)
    expect(parseAdminOrdersSearch('9568').odooSaleOrderId).toBe(9568)
    expect(parseAdminOrdersSearch('cmtyiitu000225s01fitwlrgc').pwaOrderId).toBe(
      'cmtyiitu000225s01fitwlrgc',
    )
  })
})

describe('buildPwaOrderSearchWhere', () => {
  it('cerca anche odooSaleOrderId per IDL-2026-09568', () => {
    const where = buildPwaOrderSearchWhere('#IDL-2026-09568')
    expect(where.OR).toEqual(
      expect.arrayContaining([{ odooSaleOrderId: 9568 }]),
    )
  })
})

describe('odooListSearchTerm', () => {
  it('passa l’id numerico a Odoo', () => {
    expect(odooListSearchTerm('#IDL-2026-09568')).toBe('9568')
    expect(odooListSearchTerm('hello@example.com')).toBeUndefined()
  })
})
