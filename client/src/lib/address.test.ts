import { describe, expect, it } from 'vitest'
import { shippingAddressFromUser } from './address'
import type { UserDTO } from '@/types/dto'

function user(overrides: Partial<UserDTO> = {}): UserDTO {
  return {
    id: 'u1',
    email: 'hello@example.com',
    firstName: 'Roberto',
    lastName: 'Zaccardi',
    phone: null,
    status: 'active',
    shippingAddress: null,
    preferredPaymentMethod: null,
    customerSegment: 'retail',
    pricelistLabel: '',
    isProfessional: false,
    companyName: null,
    vatNumber: null,
    fiscalCode: null,
    pec: null,
    sdiCode: null,
    vatCountryCode: null,
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

describe('shippingAddressFromUser', () => {
  it('estrae il civico da line1 se il profilo non ha streetNumber', () => {
    const address = shippingAddressFromUser(
      user({
        shippingAddress: {
          firstName: 'Roberto',
          lastName: 'Zaccardi',
          line1: 'Via Roma 69',
          city: 'Roma',
          postalCode: '00100',
          country: 'IT',
        },
      }),
    )
    expect(address.line1).toBe('Via Roma')
    expect(address.streetNumber).toBe('69')
  })

  it('mantiene il civico già salvato nel campo dedicato', () => {
    const address = shippingAddressFromUser(
      user({
        shippingAddress: {
          firstName: 'Roberto',
          lastName: 'Zaccardi',
          line1: 'Via Roma',
          streetNumber: '69',
          city: 'Roma',
          postalCode: '00100',
          country: 'IT',
        },
      }),
    )
    expect(address.line1).toBe('Via Roma')
    expect(address.streetNumber).toBe('69')
  })
})
