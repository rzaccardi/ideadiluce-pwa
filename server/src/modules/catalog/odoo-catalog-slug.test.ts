import { describe, expect, it } from 'vitest'
import { slugifyBrandName, slugifyCatalogToken } from './odoo-catalog-slug.js'

describe('odoo-catalog-slug', () => {
  it('slugifica nomi brand', () => {
    expect(slugifyBrandName('AIGOSTAR')).toBe('aigostar')
    expect(slugifyBrandName('3M ITALIA')).toBe('3m-italia')
  })

  it('normalizza token catalogo', () => {
    expect(slugifyCatalogToken('Illuminazione tecnica')).toBe('illuminazione-tecnica')
  })
})
