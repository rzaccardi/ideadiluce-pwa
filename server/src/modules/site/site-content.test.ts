import { describe, expect, it } from 'vitest'
import { countTranslatableStrings, collectTranslatableStringSlots } from './site-content-i18n.js'
import { mergeSiteContentWithDefaults } from './site-content.merge.js'
import { DEFAULT_SHELL_IT } from './site-content.defaults.js'

describe('mergeSiteContentWithDefaults', () => {
  it('mantiene i campi salvati e riempie i default mancanti', () => {
    const merged = mergeSiteContentWithDefaults('shell', {
      utilityBar: {
        messages: ['Messaggio custom'],
      },
    }) as typeof DEFAULT_SHELL_IT

    expect(merged.utilityBar.messages).toEqual(['Messaggio custom'])
    expect(merged.utilityBar.links.length).toBeGreaterThan(0)
    expect(merged.nav.items.length).toBe(DEFAULT_SHELL_IT.nav.items.length)
  })

  it('sostituisce gli array editoriali salvati', () => {
    const merged = mergeSiteContentWithDefaults('shell', {
      trustBar: [{ title: 'Solo titolo custom', subtitle: 'Sottotitolo custom' }],
    }) as typeof DEFAULT_SHELL_IT

    expect(merged.trustBar).toHaveLength(1)
    expect(merged.trustBar[0]?.title).toBe('Solo titolo custom')
  })
})

describe('site-content-i18n', () => {
  it('esclude href e url dalla traduzione', () => {
    const slots = collectTranslatableStringSlots({
      title: 'Titolo da tradurre',
      href: '/catalogo',
      ctaHref: 'https://example.com',
      code: 'GU10',
    })

    expect(slots).toHaveLength(1)
    expect(slots[0]?.value).toBe('Titolo da tradurre')
  })

  it('non salta etichette di menu in una sola parola', () => {
    const slots = collectTranslatableStringSlots({
      label: 'Sospensione',
      code: 'GU10',
      href: '/catalogo',
    })

    expect(slots.map((slot) => slot.value)).toEqual(['Sospensione'])
  })

  it('conta le stringhe traducibili nel contenuto shell', () => {
    const count = countTranslatableStrings(DEFAULT_SHELL_IT)
    expect(count).toBeGreaterThan(10)
  })
})
