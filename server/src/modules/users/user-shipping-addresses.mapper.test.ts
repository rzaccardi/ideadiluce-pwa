import { describe, expect, it } from 'vitest'
import { mergeShippingAddressList } from './user-shipping-addresses.mapper.js'
import { odooShippingAddressId } from '../../adapters/odoo/odoo-partner-shipping.js'
import type { OdooShippingDestination } from '../../adapters/odoo/odooCustomerAdapter.js'

function profile(
  overrides: Partial<OdooShippingDestination['profile']> = {},
): OdooShippingDestination['profile'] {
  return {
    firstName: 'Nbi',
    lastName: 'SPA',
    line1: 'Via Giulio Vincenzo Bona',
    streetNumber: '65',
    isSnc: false,
    city: 'Roma',
    postalCode: '00158',
    country: 'IT',
    ...overrides,
  }
}

describe('mergeShippingAddressList', () => {
  const odoo: OdooShippingDestination[] = [
    {
      odooPartnerId: 100,
      kind: 'parent',
      label: 'Nbi SPA',
      profile: profile({}),
    },
    {
      odooPartnerId: 201,
      kind: 'delivery',
      label: 'Salvatore Giacalone',
      profile: profile({
        firstName: 'Salvatore',
        lastName: 'Giacalone',
        line1: 'Via del Corniolo',
        streetNumber: '',
        city: 'Lucca',
        postalCode: '55100',
      }),
    },
    {
      odooPartnerId: 202,
      kind: 'delivery',
      label: 'Massimo Arrighi',
      profile: profile({
        firstName: 'Massimo',
        lastName: 'Arrighi',
        line1: 'Via Marina',
        streetNumber: '',
        city: 'Massa',
        postalCode: '54100',
      }),
    },
  ]

  it('marca default il child delivery selezionato e non inventa i contact persona', () => {
    const addresses = mergeShippingAddressList({
      odoo,
      local: {
        id: odooShippingAddressId(201),
        firstName: 'Salvatore',
        lastName: 'Giacalone',
        line1: 'Via del Corniolo',
        city: 'Lucca',
        postalCode: '55100',
        country: 'IT',
      },
    })
    expect(addresses.map((row) => row.label)).toEqual([
      'Nbi SPA',
      'Salvatore Giacalone',
      'Massimo Arrighi',
    ])
    expect(addresses.find((row) => row.isDefault)?.label).toBe('Salvatore Giacalone')
    expect(addresses.find((row) => row.source === 'odoo_parent')?.canDelete).toBe(false)
    expect(addresses.find((row) => row.source === 'odoo_delivery')?.canDelete).toBe(true)
  })

  it('aggiunge l’indirizzo locale se non corrisponde a un child Odoo', () => {
    const addresses = mergeShippingAddressList({
      odoo: [odoo[0]!],
      local: {
        firstName: 'Mario',
        lastName: 'Rossi',
        line1: 'Via Torino',
        streetNumber: '1',
        city: 'Milano',
        postalCode: '20100',
        country: 'IT',
      },
    })
    expect(addresses[0]?.source).toBe('local')
    expect(addresses[0]?.isDefault).toBe(true)
  })
})
