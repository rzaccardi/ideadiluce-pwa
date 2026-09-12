import { describe, expect, it } from 'vitest'
import { buildAccountSaleOrderDomain } from './odoo-order-source.js'

describe('buildAccountSaleOrderDomain', () => {
  it('lista solo sale/done di default', () => {
    expect(buildAccountSaleOrderDomain()).toEqual([['state', 'in', ['sale', 'done']]])
  })

  it('include le bozze PWA senza escludere i confermati', () => {
    expect(buildAccountSaleOrderDomain({ includePwaDrafts: true, partnerIds: [11913] })).toEqual([
      '|',
      ['state', 'in', ['sale', 'done']],
      '&',
      ['state', 'in', ['draft', 'sent']],
      ['client_order_ref', '=ilike', 'PWA%'],
      ['partner_id', 'in', [11913]],
    ])
  })
})
