import { describe, expect, it } from 'vitest'
import { normalizeProductCode, parseQuickReorderText } from './catalog-code-parser.js'

describe('parseQuickReorderText', () => {
  it('parses EAN with multiply sign', () => {
    expect(parseQuickReorderText('8711500411990 ×10')).toEqual([
      { code: '8711500411990', quantity: 10 },
    ])
  })

  it('parses multiple lines with x and default qty', () => {
    expect(
      parseQuickReorderText('8711500411990 ×10\n4058075609907 x24\n322805 ×4\n4058075609907'),
    ).toEqual([
      { code: '8711500411990', quantity: 10 },
      { code: '4058075609907', quantity: 24 },
      { code: '322805', quantity: 4 },
      { code: '4058075609907', quantity: 1 },
    ])
  })

  it('parses tab-separated excel rows', () => {
    expect(parseQuickReorderText('8711500411990\t10')).toEqual([
      { code: '8711500411990', quantity: 10 },
    ])
  })
})

describe('normalizeProductCode', () => {
  it('trims and uppercases', () => {
    expect(normalizeProductCode(' 8711500411990 ')).toBe('8711500411990')
    expect(normalizeProductCode('abc-123')).toBe('ABC-123')
  })
})
