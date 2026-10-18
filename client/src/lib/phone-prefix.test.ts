import { describe, expect, it } from 'vitest'
import { joinPhone, splitPhone } from './phone-prefix'

describe('splitPhone', () => {
  it('usa il paese di default se manca il prefisso', () => {
    expect(splitPhone('333 1234567', 'IT')).toEqual({
      country: 'IT',
      dial: '39',
      national: '3331234567',
    })
  })

  it('riconosce il prefisso internazionale più lungo', () => {
    expect(splitPhone('+351912345678', 'IT')).toMatchObject({ country: 'PT', dial: '351' })
    expect(splitPhone('0033612345678', 'IT')).toMatchObject({ country: 'FR', dial: '33' })
  })

  it('per +1 preferisce il paese già selezionato tra USA e Canada', () => {
    expect(splitPhone('+14155552671', 'CA').country).toBe('CA')
    expect(splitPhone('+14155552671', 'IT').country).toBe('US')
  })
})

describe('joinPhone', () => {
  it('compone E.164 e lascia vuoto se non ci sono cifre', () => {
    expect(joinPhone('IT', '333 1234567')).toBe('+393331234567')
    expect(joinPhone('FR', '   ')).toBe('')
  })
})
