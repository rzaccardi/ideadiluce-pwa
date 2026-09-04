import { describe, expect, it } from 'vitest'
import { htmlColorFromOdooAttribute, parseCssColorFromOdoo } from './odooAttributeColor.js'

describe('parseCssColorFromOdoo', () => {
  it('normalizza hex e rgb', () => {
    expect(parseCssColorFromOdoo('#1F1C17')).toBe('#1f1c17')
    expect(parseCssColorFromOdoo('rgb(31, 28, 23)')).toBe('#1f1c17')
  })

  it('non interpreta nomi colore', () => {
    expect(parseCssColorFromOdoo('Nero')).toBeNull()
  })
})

describe('htmlColorFromOdooAttribute', () => {
  it('legge html_color e ignora color kanban', () => {
    expect(
      htmlColorFromOdooAttribute({
        label: 'Colore',
        value: 'Nero',
        html_color: '#1F1C17',
        color: 2,
      }),
    ).toBe('#1f1c17')
  })
})
