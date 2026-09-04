import { describe, expect, it } from 'vitest'
import { htmlColorFromOdooAttribute, parseCssColorFromOdoo } from './odoo-attribute-color'

describe('parseCssColorFromOdoo', () => {
  it('normalizza hex, rgb e packed integer', () => {
    expect(parseCssColorFromOdoo('#1F1C17')).toBe('#1f1c17')
    expect(parseCssColorFromOdoo('1F1C17')).toBe('#1f1c17')
    expect(parseCssColorFromOdoo('#abc')).toBe('#aabbcc')
    expect(parseCssColorFromOdoo('rgb(31, 28, 23)')).toBe('#1f1c17')
    expect(parseCssColorFromOdoo('31, 28, 23')).toBe('#1f1c17')
    expect(parseCssColorFromOdoo(0x1f1c17)).toBe('#1f1c17')
    expect(parseCssColorFromOdoo({ r: 31, g: 28, b: 23 })).toBe('#1f1c17')
  })

  it('non interpreta nomi colore', () => {
    expect(parseCssColorFromOdoo('Nero')).toBeNull()
    expect(parseCssColorFromOdoo('red')).toBeNull()
    expect(parseCssColorFromOdoo('')).toBeNull()
    expect(parseCssColorFromOdoo(false)).toBeNull()
  })
})

describe('htmlColorFromOdooAttribute', () => {
  it('legge html_color Odoo e ignora l’indice kanban `color`', () => {
    expect(
      htmlColorFromOdooAttribute({
        attribute_id: 1,
        label: 'Colore',
        value: 'Nero opaco',
        html_color: '#1F1C17',
        color: 2,
      }),
    ).toBe('#1f1c17')
  })

  it('estrae hex dal value se il campo dedicato manca', () => {
    expect(
      htmlColorFromOdooAttribute({
        label: 'Colore',
        value: 'Nero (#1F1C17)',
      }),
    ).toBe('#1f1c17')
  })

  it('non inventa un colore dal nome', () => {
    expect(
      htmlColorFromOdooAttribute({
        label: 'Colore',
        value: 'Alluminio anodizzato oro',
      }),
    ).toBeUndefined()
  })
})
