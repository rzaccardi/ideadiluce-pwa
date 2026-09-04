import { describe, expect, it } from 'vitest'
import type { UserDTO } from '@/types/dto'
import {
  accountProfilePrefillFromUser,
  applyAccountProfilePrefill,
  emptyAccountProfilePrefill,
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
