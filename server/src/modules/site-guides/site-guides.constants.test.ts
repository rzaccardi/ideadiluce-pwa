import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SITE_GUIDES,
  isDynamicGuidePageKey,
  isValidGuideSlug,
  slugifyGuideTitle,
} from './site-guides.constants.js'
import { blankGuideArticleContent, CONTENT_PAGE_DEFAULTS } from '../site/site-content-pages.defaults.js'
import { DEFAULT_SHELL_IT, defaultSiteContent, isAllowedSitePageKey } from '../site/site-content.defaults.js'
import { guideCreateSchema } from './site-guides.service.js'

describe('slugifyGuideTitle', () => {
  it('normalizza accenti, spazi e caratteri speciali', () => {
    expect(slugifyGuideTitle('Luce calda o fredda?')).toBe('luce-calda-o-fredda')
    expect(slugifyGuideTitle('  Illuminare il soggiorno  ')).toBe('illuminare-il-soggiorno')
    expect(slugifyGuideTitle('Caffè & tè')).toBe('caffe-te')
  })

  it('restituisce stringa vuota se non restano caratteri validi', () => {
    expect(slugifyGuideTitle('???')).toBe('')
  })
})

describe('guide slug / pageKey', () => {
  it('accetta slug kebab-case', () => {
    expect(isValidGuideSlug('nuova-guida-led')).toBe(true)
    expect(isValidGuideSlug('a')).toBe(true)
    expect(isValidGuideSlug('Foo')).toBe(false)
    expect(isValidGuideSlug('-foo')).toBe(false)
    expect(isValidGuideSlug('foo--bar')).toBe(false)
  })

  it('riconosce pageKey dinamici delle guide', () => {
    expect(isDynamicGuidePageKey('guide-nuova-guida-led')).toBe(true)
    expect(isDynamicGuidePageKey('guide')).toBe(false)
    expect(isDynamicGuidePageKey('guide-luce-calda-o-fredda')).toBe(true)
    expect(isAllowedSitePageKey('guide-articolo-custom')).toBe(true)
    expect(isAllowedSitePageKey('home')).toBe(true)
    expect(isAllowedSitePageKey('not-a-page')).toBe(false)
  })

  it('include guide tecniche distinte nel seed', () => {
    const slugs = DEFAULT_SITE_GUIDES.map((guide) => guide.slug)
    expect(slugs).toEqual(expect.arrayContaining(['dimmerabilita', 'grado-ip', 'retrofit-led']))
    expect(CONTENT_PAGE_DEFAULTS['guide-dimmerabilita'].title).toMatch(/Dimmerabilità/i)
    expect(CONTENT_PAGE_DEFAULTS['guide-grado-ip'].title).toMatch(/Grado IP/i)
    expect(CONTENT_PAGE_DEFAULTS['guide-retrofit-led'].title).toMatch(/Retrofit LED/i)
  })
})

describe('GUIDE TECNICHE mega menu', () => {
  it('assegna href distinti a ogni voce', () => {
    const tecnico = DEFAULT_SHELL_IT.nav.items.find(
      (item) => item.kind === 'dropdown' && item.id === 'tecnico',
    )
    expect(tecnico?.kind).toBe('dropdown')
    if (tecnico?.kind !== 'dropdown') return

    const guideCol = tecnico.panel.columns.find((col) => col.title === 'GUIDE TECNICHE')
    expect(guideCol).toBeDefined()
    const hrefs = guideCol!.links.map((link) => link.href)
    expect(hrefs).toEqual([
      '/guide/luce-calda-naturale-fredda',
      '/guide/scegliere-lampadina-led',
      '/guide/dimmerabilita',
      '/guide/grado-ip',
      '/guide/retrofit-led',
    ])
    expect(new Set(hrefs).size).toBe(hrefs.length)
  })
})

describe('blankGuideArticleContent', () => {
  it('usa il titolo fornito e layout article', () => {
    const content = blankGuideArticleContent('Come scegliere un dimmer')
    expect(content.layout).toBe('article')
    expect(content.title).toBe('Come scegliere un dimmer')
    expect(content.blocks).toEqual([])
  })

  it('fornisce fallback defaultSiteContent per guide non seedate', () => {
    const content = defaultSiteContent('guide-articolo-custom' as 'guide-glossario')
    expect((content as { title: string }).title).toBe('Nuova guida')
  })
})

describe('guideCreateSchema', () => {
  it('accetta titolo e categoria, slug opzionale', () => {
    const parsed = guideCreateSchema.parse({
      title: 'Come scegliere un dimmer',
      category: 'TECNICO',
    })
    expect(parsed.title).toBe('Come scegliere un dimmer')
    expect(parsed.slug).toBeUndefined()
  })

  it('rifiuta slug non kebab-case', () => {
    const result = guideCreateSchema.safeParse({
      title: 'Test',
      category: 'BASE',
      slug: 'Hello World',
    })
    expect(result.success).toBe(false)
  })
})
