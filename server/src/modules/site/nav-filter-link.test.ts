import { describe, expect, it } from 'vitest'
import {
  applyFilterPinToLink,
  buildNavFilterHref,
  resolveNavFilterLabel,
  resolveShellFilterLinks,
} from './nav-filter-link.js'
import type { CatalogFiltersDTO } from '../catalog/catalog-odoo-search.service.js'
import type { SiteShellContent } from './site.types.js'

const filters: CatalogFiltersDTO = {
  totalMatching: 10,
  appliedFilters: {},
  worlds: [],
  categories: [
    {
      slug: 'tecnico',
      name: 'Tecnico',
      parentSlug: null,
      count: 10,
      children: [{ slug: 'led', name: 'LED', parentSlug: 'tecnico', count: 5, children: [] }],
    },
  ],
  brands: [{ slug: 'osram', name: 'OSRAM', count: 3 }],
  tipologie: [],
  ambienti: [],
  stili: [],
  attacchi: [{ value: 'e27', label: 'E27', count: 2 }],
  wattaggi: [],
  colorTemps: [],
  tags: [{ value: 'automoto', label: 'Automotive', count: 40 }],
  specs: [],
}

describe('nav-filter-link', () => {
  it('costruisce href senza query testuali', () => {
    expect(buildNavFilterHref('category', 'led', 'technical')).toBe('/categoria-tecnica/led')
    expect(buildNavFilterHref('tag', 'automoto', 'technical')).toBe(
      '/negozio?world=technical&tag=automoto',
    )
    expect(buildNavFilterHref('brand', 'osram')).toBe('/brand/osram')
    expect(buildNavFilterHref('attacco', 'E27')).toBe('/attacco/e27')
  })

  it('risolve label da filtri Odoo', () => {
    expect(resolveNavFilterLabel(filters, 'tag', 'automoto')).toBe('Automotive')
    expect(resolveNavFilterLabel(filters, 'category', 'led')).toBe('LED')
    expect(resolveNavFilterLabel(filters, 'brand', 'osram')).toBe('OSRAM')
  })

  it('applica pin su link e shell', () => {
    const link = applyFilterPinToLink(
      {
        label: 'fallback',
        href: '/old',
        filterKind: 'tag',
        filterValue: 'automoto',
        filterWorld: 'technical',
      },
      filters,
    )
    expect(link.label).toBe('Automotive')
    expect(link.href).toBe('/negozio?world=technical&tag=automoto')

    const shell = {
      utilityBar: { messages: [], links: [] },
      nav: {
        items: [
          {
            kind: 'dropdown',
            id: 'tecnico',
            label: 'Tecnica',
            panel: {
              columns: [
                {
                  title: 'APP',
                  links: [
                    {
                      label: 'x',
                      href: '/q',
                      filterKind: 'tag',
                      filterValue: 'automoto',
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
      trustBar: [],
      footer: {
        columns: [],
        notFoundCta: { title: '', description: '', ctaLabel: '', ctaHref: '' },
        legalNote: '',
      },
    } as SiteShellContent

    const resolved = resolveShellFilterLinks(shell, filters)
    const item = resolved.nav.items[0]
    if (item.kind !== 'dropdown') throw new Error('expected dropdown')
    expect(item.panel.columns[0]?.links[0]?.label).toBe('Automotive')
    expect(item.panel.columns[0]?.links[0]?.filterWorld).toBe('technical')
  })
})
