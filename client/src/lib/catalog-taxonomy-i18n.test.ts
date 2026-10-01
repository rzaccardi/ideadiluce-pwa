import { describe, expect, it } from 'vitest'
import {
  extractTaxonomyTokenFromFilterValue,
  translateCatalogFilterOptionLabel,
  translateCatalogTaxonomyLabel,
  translateTaxonomyHubLabel,
  translateTaxonomyPageSubtitle,
  translateTaxonomyPageTitle,
} from './catalog-taxonomy-i18n'
import { buildStileTaxonomy, buildTipologiaTaxonomy, buildAttaccoTaxonomy } from './catalog-taxonomy'
import type { MessageKey } from '@/i18n/messages/keys'
import { messages as EN } from '@/i18n/messages/en'
import { messages as IT } from '@/i18n/messages/it'
import { translateCategoryFilterGroups } from './translate-category-filter-groups'

const tEn = (key: MessageKey) => EN[key]
const tIt = (key: MessageKey) => IT[key]
const tParamsEn = (key: MessageKey, params: Record<string, string | number>) => {
  let text = EN[key]
  for (const [k, v] of Object.entries(params)) {
    text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
  }
  return text
}

describe('catalog-taxonomy-i18n', () => {
  it('traduce tipologiche e ambienti noti', () => {
    expect(translateCatalogTaxonomyLabel('tavolo', tEn)).toBe('Table')
    expect(translateCatalogTaxonomyLabel('sospensione', tEn)).toBe('Pendant')
    expect(translateCatalogTaxonomyLabel('soggiorno', tEn)).toBe('Living room')
    expect(translateCatalogTaxonomyLabel('Tavolo', tEn)).toBe('Table')
    expect(translateCatalogTaxonomyLabel('tavolo', tIt)).toBe('Tavolo')
  })

  it('traduce categorie tecniche note', () => {
    expect(translateCatalogTaxonomyLabel('alogene', tEn)).toBe('Halogen')
    expect(translateCatalogTaxonomyLabel('fluorescente', tEn)).toBe('Fluorescent')
    expect(translateCatalogTaxonomyLabel('led', tEn)).toBe('LED')
  })

  it('lascia invariati valori non mappati (facet Odoo raw)', () => {
    expect(translateCatalogTaxonomyLabel('sospensione-2', tEn, 'Sospensione 2')).toBe('Sospensione 2')
    expect(translateCatalogTaxonomyLabel('dimmerabile-xyz', tEn)).toBe('Dimmerabile xyz')
  })

  it('estrae token da value landing', () => {
    expect(extractTaxonomyTokenFromFilterValue('tipologia-tavolo')).toBe('tavolo')
    expect(extractTaxonomyTokenFromFilterValue('category-led')).toBe('led')
    expect(extractTaxonomyTokenFromFilterValue(undefined, 'soggiorno')).toBe('soggiorno')
  })

  it('traduce option label filtri', () => {
    expect(
      translateCatalogFilterOptionLabel({ label: 'Tavolo', value: 'tipologia-tavolo' }, tEn),
    ).toBe('Table')
    expect(
      translateCatalogFilterOptionLabel({ label: 'Nero', value: 'finitura-nero' }, tEn),
    ).toBe('Black')
  })

  it('traduce titolo e sottotitolo pagina tassonomia', () => {
    const tip = buildTipologiaTaxonomy('tavolo')
    tip.label = 'Tavolo'
    expect(translateTaxonomyPageTitle(tip, tEn, tParamsEn)).toBe('Table')
    expect(translateTaxonomyPageSubtitle(tip, tParamsEn, tEn)).toBe('Products filtered by type.')

    const stile = buildStileTaxonomy('moderno')
    stile.label = 'Moderno'
    expect(translateTaxonomyPageTitle(stile, tEn, tParamsEn)).toBe('Style Modern')

    const attacco = buildAttaccoTaxonomy('gu10')
    expect(translateTaxonomyPageTitle(attacco, tEn, tParamsEn)).toBe('Socket GU10')
    expect(translateTaxonomyHubLabel('attacco', tEn)).toBe('Socket')
  })
})

describe('translateCategoryFilterGroups', () => {
  it('traduce gruppi e opzioni taxonomy note', () => {
    const groups = translateCategoryFilterGroups(
      [
        {
          kind: 'checkbox',
          label: 'Tipologia',
          options: [
            { label: 'Tavolo', value: 'tipologia-tavolo', queryToken: 'tavolo' },
            { label: 'Sospensione', value: 'tipologia-sospensione', queryToken: 'sospensione' },
          ],
        },
        {
          kind: 'checkbox',
          label: 'Disponibilità',
          options: [{ label: 'Pronta consegna', value: 'stock-in' }],
        },
      ],
      tEn,
    )
    expect(groups[0]?.label).toBe('Type')
    expect(groups[0]?.options.map((o) => o.label)).toEqual(['Table', 'Pendant'])
    expect(groups[1]?.label).toBe('Availability')
    expect(groups[1]?.options[0]?.label).toBe('Ready to ship')
  })
})
