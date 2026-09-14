import { describe, expect, it } from 'vitest'
import type { UserDTO } from '@/types/dto'
import {
  catalogGrossCents,
  catalogVatCentsFromNet,
  displaysCatalogPriceIncVat,
  formatPriceDisplayModeLabel,
  resolveCatalogPriceDisplay,
} from './price-display'

function user(
  segment: UserDTO['customerSegment'],
  extras?: Partial<Pick<UserDTO, 'isProfessional' | 'personalizedPricing'>>,
): UserDTO {
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
    isProfessional: extras?.isProfessional ?? segment === 'professional',
    personalizedPricing:
      extras?.personalizedPricing ??
      (segment === 'business' || segment === 'professional'),
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

describe('catalog VAT display', () => {
  it('calcola IVA e lordo come il tax service (22%, arrotondamento centesimi)', () => {
    expect(catalogVatCentsFromNet(10_000)).toBe(2_200)
    expect(catalogGrossCents(10_000)).toBe(12_200)
    expect(catalogVatCentsFromNet(10_001)).toBe(2_200)
    expect(catalogGrossCents(10_001)).toBe(12_201)
    expect(catalogGrossCents(0)).toBe(0)
  })

  it('mostra IVA inclusa per guest e retail pubblico', () => {
    expect(displaysCatalogPriceIncVat(null)).toBe(true)
    expect(displaysCatalogPriceIncVat(user('retail'))).toBe(true)
    const retail = resolveCatalogPriceDisplay(10_000, user('retail'))
    expect(retail.vatIncluded).toBe(true)
    expect(retail.cents).toBe(12_200)
    expect(retail.captionKey).toBe('product.price.vatIncluded')
  })

  it('mostra IVA esclusa per listino sessione B2B/pro', () => {
    expect(displaysCatalogPriceIncVat(user('business'))).toBe(false)
    expect(displaysCatalogPriceIncVat(user('professional'))).toBe(false)
    const pro = resolveCatalogPriceDisplay(10_000, user('professional'))
    expect(pro.vatIncluded).toBe(false)
    expect(pro.cents).toBe(10_000)
    expect(pro.captionKey).toBe('product.price.vatExcluded')
  })

  it('etichetta DTO ex_vat resta IVA esclusa (listino netto)', () => {
    expect(formatPriceDisplayModeLabel('ex_vat')).toBe('IVA esclusa')
    expect(formatPriceDisplayModeLabel(undefined)).toBeNull()
  })
})
