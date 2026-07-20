import { describe, expect, it } from 'vitest'
import {
  attaccoPathSlugFromCode,
  buildAttaccoTaxonomy,
  buildBrandTaxonomy,
  buildCategoryTaxonomy,
  buildStileTaxonomy,
  buildTipologiaTaxonomy,
  canonicalizeBrandSlug,
  resolveAttaccoCodeFromPathSlug,
  taxonomyPageTitle,
  taxonomyPath,
} from './catalog-taxonomy'

describe('catalog-taxonomy', () => {
  it('risolve path slug attacco ↔ codice API', () => {
    expect(resolveAttaccoCodeFromPathSlug('gu10')).toBe('GU10')
    expect(resolveAttaccoCodeFromPathSlug('gu5-3')).toBe('GU5.3')
    expect(attaccoPathSlugFromCode('GU5.3')).toBe('gu5-3')
    expect(attaccoPathSlugFromCode('G13')).toBe('g13')
  })

  it('costruisce H1 dinamici', () => {
    expect(taxonomyPageTitle(buildAttaccoTaxonomy('gu10'))).toBe('Attacco GU10')
    expect(taxonomyPageTitle(buildTipologiaTaxonomy('sospensione'))).toBe('Sospensione')
    expect(taxonomyPageTitle(buildStileTaxonomy('moderno'))).toBe('Stile Moderno')
    expect(taxonomyPageTitle(buildCategoryTaxonomy('led'))).toBe('Led')
  })

  it('costruisce path tassonomia', () => {
    expect(taxonomyPath('attacco', 'gu10')).toBe('/attacco/gu10')
    expect(taxonomyPath('stile', 'minimal')).toBe('/stile/minimal')
    expect(taxonomyPath('tipologia', 'tavolo')).toBe('/tipologia/tavolo')
    expect(taxonomyPath('category', 'led')).toBe('/categoria-tecnica/led')
  })

  it('attacco taxonomy forza world technical', () => {
    const t = buildAttaccoTaxonomy('e27')
    expect(t.world).toBe('technical')
    expect(t.value).toBe('E27')
    expect(t.hubPath).toBe('/attacco')
  })

  it('canonica brand slug tlb-italy → tlb', () => {
    expect(canonicalizeBrandSlug('tlb-italy')).toBe('tlb')
    expect(canonicalizeBrandSlug('TLB')).toBe('tlb')
    const t = buildBrandTaxonomy('tlb-italy', 'TLB')
    expect(t.value).toBe('tlb')
    expect(taxonomyPageTitle(t)).toBe('TLB')
  })
})
