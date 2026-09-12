import { describe, expect, it } from 'vitest'
import type { UserDTO, UserShippingAddressDTO } from '@/types/dto'
import {
  accountProfilePrefillFromUser,
  applyAccountProfilePrefill,
  emptyAccountProfilePrefill,
  pickProfessionalPrefillAddress,
  professionalRequestNotesFromPrefill,
} from './account-profile-prefill'

function user(overrides: Partial<UserDTO> = {}): UserDTO {
  return {
    id: 'u1',
    email: 'mario.rossi@example.com',
    firstName: 'Mario',
    lastName: 'Rossi',
    phone: '+39 333 1234567',
    status: 'active',
    shippingAddress: null,
    preferredPaymentMethod: null,
    customerSegment: 'retail',
    pricelistLabel: '',
    isProfessional: false,
    personalizedPricing: false,
    companyName: 'Rossi Impianti Srl',
    vatNumber: 'IT12345678901',
    fiscalCode: 'RSSMRA80A01H501U',
    pec: 'rossi@pec.it',
    sdiCode: 'ABC1234',
    vatCountryCode: 'IT',
    vatFormatValid: null,
    vatChecksumValid: null,
    fiscalCodeValid: null,
    viesValid: null,
    viesName: null,
    viesAddress: null,
    taxValidationStatus: null,
    taxCheckedAt: null,
    odooPartnerId: null,
    odooPricelistId: null,
    ...overrides,
  }
}

describe('accountProfilePrefillFromUser', () => {
  it('restituisce campi vuoti se non c\'e un account', () => {
    expect(accountProfilePrefillFromUser(null)).toEqual(emptyAccountProfilePrefill())
  })

  it('mappa anagrafica e dati aziendali dal profilo account', () => {
    expect(accountProfilePrefillFromUser(user())).toEqual({
      firstName: 'Mario',
      lastName: 'Rossi',
      contactName: 'Mario Rossi',
      email: 'mario.rossi@example.com',
      phone: '+39 333 1234567',
      companyName: 'Rossi Impianti Srl',
      vatNumber: 'IT12345678901',
      fiscalCode: 'RSSMRA80A01H501U',
      pec: 'rossi@pec.it',
      sdiCode: 'ABC1234',
      country: 'IT',
      addressLine: '',
    })
  })

  it('usa nome, telefono, paese e indirizzo di spedizione come fallback', () => {
    const prefill = accountProfilePrefillFromUser(
      user({
        firstName: null,
        lastName: null,
        phone: null,
        vatCountryCode: null,
        shippingAddress: {
          firstName: 'Anna',
          lastName: 'Bianchi',
          line1: 'Via Roma',
          streetNumber: '12',
          city: 'Milano',
          postalCode: '20121',
          country: 'FR',
          phone: '+33 1 23456789',
        },
      }),
    )

    expect(prefill.contactName).toBe('Anna Bianchi')
    expect(prefill.phone).toBe('+33 1 23456789')
    expect(prefill.country).toBe('FR')
    expect(prefill.addressLine).toBe('Via Roma 12, 20121 Milano')
  })

  it('usa un indirizzo salvato e non sovrascrive il telefono del profilo', () => {
    const prefill = accountProfilePrefillFromUser(
      user({ shippingAddress: null }),
      {
        address: {
          firstName: 'Anna',
          lastName: 'Bianchi',
          line1: 'Corso Como',
          streetNumber: '10',
          line2: 'Scala B',
          city: 'Milano',
          postalCode: '20154',
          country: 'IT',
          phone: '+39 02 123',
        },
      },
    )

    expect(prefill.phone).toBe('+39 333 1234567')
    expect(prefill.addressLine).toBe('Corso Como 10, Scala B, 20154 Milano')
  })

  it('usa l\'indirizzo VIES se non c\'e un indirizzo di spedizione', () => {
    const prefill = accountProfilePrefillFromUser(
      user({
        shippingAddress: null,
        viesAddress: 'VIA VIES 1\n00100 ROMA',
      }),
    )
    expect(prefill.addressLine).toBe('VIA VIES 1, 00100 ROMA')
  })
})

describe('pickProfessionalPrefillAddress', () => {
  function addr(overrides: Partial<UserShippingAddressDTO>): UserShippingAddressDTO {
    return {
      id: 'odoo:1',
      label: 'Sede',
      source: 'odoo_parent',
      isDefault: false,
      canEdit: false,
      canDelete: false,
      firstName: 'Azienda',
      lastName: 'Srl',
      line1: 'Via Sede',
      streetNumber: '1',
      city: 'Milano',
      postalCode: '20100',
      country: 'IT',
      ...overrides,
    }
  }

  it('preferisce la sede Odoo all\'indirizzo di consegna predefinito', () => {
    const picked = pickProfessionalPrefillAddress([
      addr({
        id: 'odoo:2',
        source: 'odoo_delivery',
        isDefault: true,
        line1: 'Via Consegna',
      }),
      addr({ id: 'odoo:1', source: 'odoo_parent', line1: 'Via Sede' }),
    ])
    expect(picked?.id).toBe('odoo:1')
  })
})

describe('applyAccountProfilePrefill', () => {
  it('non azzera i campi già compilati', () => {
    const merged = applyAccountProfilePrefill(
      { email: 'gia.scritta@example.com', phone: '', companyName: 'Mia Srl' },
      { email: 'account@example.com', phone: '+39 333 000', companyName: 'Altra Srl' },
    )

    expect(merged).toEqual({
      email: 'gia.scritta@example.com',
      phone: '+39 333 000',
      companyName: 'Mia Srl',
    })
  })
})

describe('professionalRequestNotesFromPrefill', () => {
  it('accoda CF e indirizzo alle note senza perdere il messaggio', () => {
    expect(
      professionalRequestNotesFromPrefill({
        message: 'Richiesta upgrade',
        fiscalCode: 'RSSMRA80A01H501U',
        addressLine: 'Via Roma 12, 20121 Milano',
      }),
    ).toBe(
      'Richiesta upgrade\nCodice fiscale: RSSMRA80A01H501U\nIndirizzo: Via Roma 12, 20121 Milano',
    )
  })
})
