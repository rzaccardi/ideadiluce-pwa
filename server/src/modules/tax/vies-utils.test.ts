import { describe, expect, it } from 'vitest'
import { isUsableViesText, parseViesAddress, pickViesCompanyName } from './vies-utils.js'

describe('vies-utils', () => {
  it('filters VIES placeholders', () => {
    expect(isUsableViesText('---')).toBe(false)
    expect(isUsableViesText('Acme GmbH')).toBe(true)
  })

  it('picks company name from VIES', () => {
    expect(pickViesCompanyName('Acme GmbH')).toBe('Acme GmbH')
    expect(pickViesCompanyName('---')).toBeNull()
  })

  it('parses multiline VIES address', () => {
    const parsed = parseViesAddress('Via Roma 1\n20100 Milano')
    expect(parsed.line1).toBe('Via Roma 1')
    expect(parsed.postalCode).toBe('20100')
    expect(parsed.city).toBe('Milano')
  })
})
