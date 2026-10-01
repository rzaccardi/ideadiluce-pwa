import { describe, expect, it } from 'vitest'
import type { UserAddressDTO } from '@/types/dto'
import { formatThankYouAddressBlock, thankYouAddressesEqual } from './thank-you-address'

const baseAddress = (overrides: Partial<UserAddressDTO> = {}): UserAddressDTO => ({
  firstName: 'Mario',
  lastName: 'Rossi',
  line1: 'Via Roma',
  streetNumber: '12',
  isSnc: false,
  city: 'Roma',
  postalCode: '00100',
  province: 'RM',
  country: 'IT',
  phone: '+393331234567',
  ...overrides,
})

describe('formatThankYouAddressBlock', () => {
  it('include civico e provincia IT', () => {
    const lines = formatThankYouAddressBlock(baseAddress())
    expect(lines).toEqual([
      'Mario Rossi',
      'Via Roma 12',
      '00100 Roma (RM)',
      'IT',
      '+393331234567',
    ])
  })

  it('gestisce SNC senza duplicare il civico', () => {
    const lines = formatThankYouAddressBlock(
      baseAddress({ streetNumber: '', isSnc: true }),
    )
    expect(lines[1]).toBe('Via Roma (SNC)')
  })

  it('restituisce array vuoto senza indirizzo', () => {
    expect(formatThankYouAddressBlock(null)).toEqual([])
  })
})

describe('thankYouAddressesEqual', () => {
  it('riconosce fatturazione e spedizione uguali', () => {
    expect(thankYouAddressesEqual(baseAddress(), baseAddress())).toBe(true)
  })

  it('rileva indirizzi diversi', () => {
    expect(
      thankYouAddressesEqual(baseAddress(), baseAddress({ line1: 'Via Milano', streetNumber: '3' })),
    ).toBe(false)
  })
})
