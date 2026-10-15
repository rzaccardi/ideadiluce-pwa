import { describe, expect, it } from 'vitest'
import { normalizeOdooXmlRpcBaseUrl } from './odooClient.js'

describe('normalizeOdooXmlRpcBaseUrl', () => {
  it('lascia invariata la base host senza /odoo', () => {
    expect(normalizeOdooXmlRpcBaseUrl('https://tlbdb.odoo.com')).toBe('https://tlbdb.odoo.com')
  })

  it('rimuove /odoo usato per il client web', () => {
    expect(normalizeOdooXmlRpcBaseUrl('https://tlbdb.odoo.com/odoo')).toBe('https://tlbdb.odoo.com')
    expect(normalizeOdooXmlRpcBaseUrl('https://tlbdb.odoo.com/odoo/')).toBe('https://tlbdb.odoo.com')
  })

  it('riduce /odoo/odoo accidentale', () => {
    expect(normalizeOdooXmlRpcBaseUrl('https://tlbdb.odoo.com/odoo/odoo')).toBe(
      'https://tlbdb.odoo.com',
    )
  })
})
