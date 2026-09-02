import { describe, expect, it } from 'vitest'
import { splitLine1AndStreetNumber } from './checkout-address.validators.js'

describe('splitLine1AndStreetNumber', () => {
  it('estrae il civico da street Odoo combinata', () => {
    expect(splitLine1AndStreetNumber('Via Roma 69')).toEqual({
      line1: 'Via Roma',
      streetNumber: '69',
      isSnc: false,
    })
  })

  it('accetta civici tipo 12/A', () => {
    expect(splitLine1AndStreetNumber('Corso Italia, 12/A')).toEqual({
      line1: 'Corso Italia',
      streetNumber: '12/A',
      isSnc: false,
    })
  })
})
