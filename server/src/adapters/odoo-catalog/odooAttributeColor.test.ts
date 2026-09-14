import { describe, expect, it } from 'vitest'
import { htmlColorFromOdooAttribute, parseCssColorFromOdoo, colorSwatchesFromAttributeLines, htmlColorFromAttributeLinesForVariant } from './odooAttributeColor.js'

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

describe('attribute_lines html_color', () => {
  const lines = [
    {
      name: 'Colore',
      values: [
        { name: 'Nero', html_color: '#1F1C17', variant_ids: [101] },
        { name: 'Oro', html_color: '#D4B896', variant_ids: [102] },
        { name: 'Bianco', html_color: '#FFFFFF', variant_ids: [103] },
        { name: 'Rosso', html_color: '#FF0000', variant_ids: [104] },
      ],
    },
  ]

  it('prende al massimo 3 swatch lista', () => {
    expect(colorSwatchesFromAttributeLines(lines, 3)).toEqual(['#1f1c17', '#d4b896', '#ffffff'])
  })

  it('risolve il colore della variante dal variant_ids', () => {
    expect(htmlColorFromAttributeLinesForVariant(lines, 102, 'Colore', 'Oro')).toBe('#d4b896')
  })
})
