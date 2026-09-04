import { describe, expect, it } from 'vitest'
import { usesSessionPricelist } from './catalog-pricing'
import type { UserDTO } from '@/types/dto'

function user(segment: UserDTO['customerSegment']): UserDTO {
  return {
    id: 'u1',
    email: 'a@example.com',
    firstName: 'A',
    lastName: 'B',
    phone: null,
    shippingAddress: null,
    preferredPaymentMethod: null,
    status: 'ACTIVE',
    customerSegment: segment,
    pricelistLabel: '',
    isProfessional: segment === 'professional',
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
  }
}

describe('usesSessionPricelist', () => {
  it('è falso per guest e retail', () => {
    expect(usesSessionPricelist(null, null)).toBe(false)
    expect(usesSessionPricelist(user('retail'), null)).toBe(false)
  })

  it('è vero per rivenditore, installatore e impersonazione', () => {
    expect(usesSessionPricelist(user('business'), null)).toBe(true)
    expect(usesSessionPricelist(user('professional'), null)).toBe(true)
    expect(
      usesSessionPricelist(user('retail'), { adminEmail: 'a@bo', adminDisplayName: 'Admin' }),
    ).toBe(true)
  })
})
