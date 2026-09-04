import { describe, expect, it } from 'vitest'
import {
  brandSlugLookupKeys,
  canonicalizeBrandSlug,
  inferCatalogWorldsFromCategorySlugs,
  mergeCatalogBrandWorlds,
  slugifyBrandName,
  slugifyCatalogToken,
} from './odoo-catalog-slug.js'

describe('odoo-catalog-slug', () => {
  it('slugifica nomi brand', () => {
    expect(slugifyBrandName('AIGOSTAR')).toBe('aigostar')
    expect(slugifyBrandName('3M ITALIA')).toBe('3m-italia')
  })

  it('normalizza token catalogo', () => {
    expect(slugifyCatalogToken('Illuminazione tecnica')).toBe('illuminazione-tecnica')
  })

  it('canonicalizza alias TLB', () => {
    expect(canonicalizeBrandSlug('tlb-italy')).toBe('tlb')
    expect(canonicalizeBrandSlug('TLB')).toBe('tlb')
    expect(brandSlugLookupKeys('tlb-italy')).toEqual(expect.arrayContaining(['tlb', 'tlb-italy']))
  })

  it('infersce design/tecnico dagli slug categoria Odoo', () => {
    expect(inferCatalogWorldsFromCategorySlugs(['arredo', 'sospensioni'])).toEqual(['design'])
    expect(inferCatalogWorldsFromCategorySlugs(['tecnico', 'led'])).toEqual(['technical'])
    expect(inferCatalogWorldsFromCategorySlugs(['tecnico', 'arredo'])).toEqual(['design', 'technical'])
    expect(inferCatalogWorldsFromCategorySlugs(['led'])).toEqual([])
  })

  it('unisce i mondi brand in ordine stabile', () => {
    expect(mergeCatalogBrandWorlds(['technical'], ['design'])).toEqual(['design', 'technical'])
  })
})
