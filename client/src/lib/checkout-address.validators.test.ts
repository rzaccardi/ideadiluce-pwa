import { describe, expect, it } from 'vitest'
import {
  checkoutAddressSchema,
  mergeResolvedStreetNumber,
  splitLine1AndStreetNumber,
  toE164Phone,
} from './checkout-address.validators'

describe('splitLine1AndStreetNumber', () => {
  it('estrae il civico da una via tipo Odoo', () => {
    expect(splitLine1AndStreetNumber('Via Roma 69')).toEqual({
      line1: 'Via Roma',
      streetNumber: '69',
      isSnc: false,
    })
  })

  it('non perde un civico già presente se il geocode non lo restituisce', () => {
    expect(splitLine1AndStreetNumber('Via Roma', '69')).toEqual({
      line1: 'Via Roma',
      streetNumber: '69',
      isSnc: false,
    })
  })

  it('togli il civico duplicato da line1 se è già nel campo dedicato', () => {
    expect(splitLine1AndStreetNumber('Via Roma 69', '69')).toEqual({
      line1: 'Via Roma',
      streetNumber: '69',
      isSnc: false,
    })
  })

  it('riconosce SNC in coda alla via', () => {
    expect(splitLine1AndStreetNumber('Vicolo Cieco SNC')).toEqual({
      line1: 'Vicolo Cieco',
      streetNumber: '',
      isSnc: true,
    })
  })
})

describe('mergeResolvedStreetNumber', () => {
  it('conserva il civico già compilato se il geocode non ha street_number', () => {
    expect(
      mergeResolvedStreetNumber(
        { line1: 'Via Roma', streetNumber: '69', isSnc: false },
        { line1: 'Via Roma' },
      ),
    ).toEqual({
      line1: 'Via Roma',
      streetNumber: '69',
      isSnc: false,
    })
  })

  it('preferisce il civico restituito dal geocode', () => {
    expect(
      mergeResolvedStreetNumber(
        { line1: 'Via Roma', streetNumber: '1', isSnc: false },
        { line1: 'Via Roma', streetNumber: '69' },
      ),
    ).toEqual({
      line1: 'Via Roma',
      streetNumber: '69',
      isSnc: false,
    })
  })
})

const completeAddress = {
  firstName: 'Mario',
  lastName: 'Rossi',
  line1: 'Via Roma',
  streetNumber: '1',
  city: 'Roma',
  postalCode: '00100',
  country: 'IT',
  phone: '333 1234567',
  province: 'RM',
}

describe('checkoutAddressSchema phone', () => {
  it('rifiuta un indirizzo senza telefono', () => {
    const { phone: _phone, ...withoutPhone } = completeAddress
    expect(checkoutAddressSchema.safeParse(withoutPhone).success).toBe(false)
  })

  it('accetta un cellulare italiano', () => {
    expect(checkoutAddressSchema.safeParse(completeAddress).success).toBe(true)
  })

  it('rifiuta un indirizzo italiano senza provincia', () => {
    expect(checkoutAddressSchema.safeParse({ ...completeAddress, province: '' }).success).toBe(false)
  })

  it('normalizza il nome provincia nella sigla', () => {
    const parsed = checkoutAddressSchema.safeParse({ ...completeAddress, province: 'Roma' })
    expect(parsed.success).toBe(true)
    if (parsed.success) expect(parsed.data.province).toBe('RM')
  })
})

describe('toE164Phone', () => {
  it('normalizza cellulari italiani a E.164', () => {
    expect(toE164Phone('333 1234567')).toBe('+393331234567')
    expect(toE164Phone('+39 333 1234567')).toBe('+393331234567')
    expect(toE164Phone('0039 3331234567')).toBe('+393331234567')
  })
})
