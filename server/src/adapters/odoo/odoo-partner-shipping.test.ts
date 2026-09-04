import { describe, expect, it } from 'vitest'
import {
  isOdooChildShippingDestination,
  odooPartnerToShippingProfile,
  odooShippingAddressId,
  odooShippingDestinationKind,
  parseOdooShippingAddressId,
  shippingAddressFingerprint,
  shippingAddressesMatch,
  splitPartnerDisplayName,
} from './odoo-partner-shipping.js'

const nbiChildren = [
  { id: 1, name: 'Alessandro Fruzzetti', type: 'contact', street: false, city: false, zip: false },
  { id: 2, name: 'Luisa De Sortis', type: 'contact', street: '', city: '', zip: '' },
  {
    id: 3,
    name: 'Salvatore Giacalone',
    type: 'delivery',
    street: 'Via del Corniolo',
    city: 'Lucca',
    zip: '55100',
  },
  {
    id: 4,
    name: 'Massimo Arrighi',
    type: 'delivery',
    street: 'Via Marina',
    city: 'Massa',
    zip: '54100',
  },
] as const

describe('isOdooChildShippingDestination', () => {
  it('include solo i child delivery di Nbi SPA, non i contact persona senza via', () => {
    expect(nbiChildren.filter(isOdooChildShippingDestination).map((row) => row.name)).toEqual([
      'Salvatore Giacalone',
      'Massimo Arrighi',
    ])
  })

  it('include un contact se ha una via fisica', () => {
    expect(
      isOdooChildShippingDestination({
        id: 9,
        name: 'Ufficio cantiere',
        type: 'contact',
        street: 'Via Roma 1',
        city: 'Roma',
        zip: '00100',
      }),
    ).toBe(true)
  })

  it('esclude invoice e private', () => {
    expect(
      isOdooChildShippingDestination({
        id: 10,
        name: 'Fatturazione',
        type: 'invoice',
        street: 'Via Giulio Vincenzo Bona 65',
        city: 'Roma',
        zip: '00158',
      }),
    ).toBe(false)
    expect(
      isOdooChildShippingDestination({
        id: 11,
        name: 'Privato',
        type: 'private',
        street: 'Via Privata 1',
      }),
    ).toBe(false)
  })

  it('include type delivery anche senza street (destinazione da completare)', () => {
    expect(
      isOdooChildShippingDestination({
        id: 12,
        name: 'Cantiere nuovo',
        type: 'delivery',
        street: false,
      }),
    ).toBe(true)
  })
})

describe('odooShippingDestinationKind', () => {
  it('marca i child camion come delivery', () => {
    expect(odooShippingDestinationKind(nbiChildren[2])).toBe('delivery')
    expect(odooShippingDestinationKind(nbiChildren[0])).toBe('contact')
  })
})

describe('odoo shipping address id', () => {
  it('serializza e parsa l’id opaco odoo:{id}', () => {
    expect(odooShippingAddressId(4412)).toBe('odoo:4412')
    expect(parseOdooShippingAddressId('odoo:4412')).toBe(4412)
    expect(parseOdooShippingAddressId('local:default')).toBeNull()
    expect(parseOdooShippingAddressId('')).toBeNull()
  })
})

describe('splitPartnerDisplayName', () => {
  it('separa nome e cognome dei referenti Odoo', () => {
    expect(splitPartnerDisplayName('Salvatore Giacalone')).toEqual({
      firstName: 'Salvatore',
      lastName: 'Giacalone',
    })
    expect(splitPartnerDisplayName('Nbi SPA')).toEqual({
      firstName: 'Nbi',
      lastName: 'SPA',
    })
  })
})

describe('odooPartnerToShippingProfile', () => {
  it('mappa street+civico Odoo sul profilo PWA', () => {
    const profile = odooPartnerToShippingProfile(
      {
        id: 3,
        name: 'Salvatore Giacalone',
        type: 'delivery',
        street: 'Via del Corniolo 12',
        city: 'Lucca',
        zip: '55100',
        phone: '+39 333 0000000',
      },
      'IT',
    )
    expect(profile).toMatchObject({
      firstName: 'Salvatore',
      lastName: 'Giacalone',
      line1: 'Via del Corniolo',
      streetNumber: '12',
      city: 'Lucca',
      postalCode: '55100',
      country: 'IT',
    })
  })
})

describe('shippingAddressesMatch', () => {
  it('considera uguali via+civico spezzati o combinati', () => {
    expect(
      shippingAddressesMatch(
        { line1: 'Via del Corniolo', streetNumber: '12', city: 'Lucca', postalCode: '55100', country: 'IT' },
        { line1: 'Via del Corniolo 12', city: 'Lucca', postalCode: '55100', country: 'IT' },
      ),
    ).toBe(true)
    expect(shippingAddressFingerprint({ line1: 'Via Marina', city: 'Massa', postalCode: '54100', country: 'IT' })).toContain(
      'massa',
    )
  })
})
