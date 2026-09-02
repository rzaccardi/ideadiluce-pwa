import { describe, expect, it } from 'vitest'
import {
  mergeResolvedStreetNumber,
  splitLine1AndStreetNumber,
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
