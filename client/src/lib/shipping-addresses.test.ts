import { describe, expect, it } from 'vitest'
import { matchSavedShippingAddress, shippingAddressFingerprint } from './shipping-addresses'
import type { UserShippingAddressDTO } from '@/types/dto'

function addr(overrides: Partial<UserShippingAddressDTO>): UserShippingAddressDTO {
  return {
    id: 'odoo:1',
    label: 'Nbi SPA',
    source: 'odoo_parent',
    isDefault: false,
    canEdit: false,
    canDelete: false,
    firstName: 'Nbi',
    lastName: 'SPA',
    line1: 'Via Giulio Vincenzo Bona',
    streetNumber: '65',
    city: 'Roma',
    postalCode: '00158',
    country: 'IT',
    ...overrides,
  }
}

describe('matchSavedShippingAddress', () => {
  const addresses = [
    addr({}),
    addr({
      id: 'odoo:201',
      label: 'Salvatore Giacalone',
      source: 'odoo_delivery',
      isDefault: true,
      canEdit: true,
      canDelete: true,
      firstName: 'Salvatore',
      lastName: 'Giacalone',
      line1: 'Via del Corniolo',
      streetNumber: '',
      city: 'Lucca',
      postalCode: '55100',
    }),
  ]

  it('preferisce l’id del child partner', () => {
    expect(matchSavedShippingAddress(addresses, { ...addresses[1]!, id: 'odoo:201' })?.label).toBe(
      'Salvatore Giacalone',
    )
  })

  it('riconosce lo stesso indirizzo anche senza id', () => {
    expect(
      matchSavedShippingAddress(addresses, {
        firstName: 'Salvatore',
        lastName: 'Giacalone',
        line1: 'Via del Corniolo',
        city: 'Lucca',
        postalCode: '55100',
        country: 'IT',
      })?.id,
    ).toBe('odoo:201')
  })
})

describe('shippingAddressFingerprint', () => {
  it('normalizza via e civico', () => {
    expect(
      shippingAddressFingerprint({
        firstName: 'A',
        lastName: 'B',
        line1: 'Via Roma',
        streetNumber: '1',
        city: 'Roma',
        postalCode: '00100',
        country: 'it',
      }),
    ).toBe(
      shippingAddressFingerprint({
        firstName: 'A',
        lastName: 'B',
        line1: 'Via Roma 1',
        city: 'Roma',
        postalCode: '00100',
        country: 'IT',
      }),
    )
  })
})
