import { describe, expect, it } from 'vitest'
import {
  mapStorefrontSettings,
  normalizeLegacySiteUrl,
  DEFAULT_LEGACY_SITE_URL,
} from './storefront-settings.js'
import { storefrontSettingsPatchSchema } from './storefront-settings.validators.js'

describe('storefrontSettingsPatchSchema', () => {
  it('accetta soundsEnabled boolean', () => {
    expect(storefrontSettingsPatchSchema.parse({ soundsEnabled: false })).toEqual({
      soundsEnabled: false,
    })
  })

  it('accetta il toggle e l’URL del sito precedente', () => {
    expect(
      storefrontSettingsPatchSchema.parse({
        legacySiteNoticeEnabled: true,
        legacySiteUrl: 'https://old.ideadiluce.it/',
      }),
    ).toEqual({
      legacySiteNoticeEnabled: true,
      legacySiteUrl: 'https://old.ideadiluce.it/',
    })
  })

  it('rifiuta URL non HTTPS', () => {
    expect(() =>
      storefrontSettingsPatchSchema.parse({ legacySiteUrl: 'http://old.ideadiluce.it' }),
    ).toThrow()
  })

  it('rifiuta body vuoto', () => {
    expect(() => storefrontSettingsPatchSchema.parse({})).toThrow()
  })
})

describe('normalizeLegacySiteUrl', () => {
  it('restituisce il default se vuoto o non valido', () => {
    expect(normalizeLegacySiteUrl('')).toBe(DEFAULT_LEGACY_SITE_URL)
    expect(normalizeLegacySiteUrl('ftp://example.com')).toBe(DEFAULT_LEGACY_SITE_URL)
    expect(normalizeLegacySiteUrl('not-a-url')).toBe(DEFAULT_LEGACY_SITE_URL)
  })

  it('accetta solo HTTPS', () => {
    expect(normalizeLegacySiteUrl('https://old.ideadiluce.it')).toBe('https://old.ideadiluce.it/')
  })
})

describe('mapStorefrontSettings', () => {
  it('espone suoni e avviso sito precedente', () => {
    expect(
      mapStorefrontSettings({
        id: 'default',
        soundsEnabled: true,
        legacySiteNoticeEnabled: false,
        legacySiteUrl: 'https://old.ideadiluce.it',
        createdAt: new Date('2026-09-02T00:00:00.000Z'),
        updatedAt: new Date('2026-09-02T00:00:00.000Z'),
      }),
    ).toEqual({
      soundsEnabled: true,
      legacySiteNoticeEnabled: false,
      legacySiteUrl: 'https://old.ideadiluce.it/',
    })
  })
})
