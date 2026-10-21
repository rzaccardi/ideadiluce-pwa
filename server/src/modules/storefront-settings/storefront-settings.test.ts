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
        legacySiteUrl: 'https://old.ideadiluce.com/',
      }),
    ).toEqual({
      legacySiteNoticeEnabled: true,
      legacySiteUrl: 'https://old.ideadiluce.com/',
    })
  })

  it('rifiuta URL non HTTPS', () => {
    expect(() =>
      storefrontSettingsPatchSchema.parse({ legacySiteUrl: 'http://old.ideadiluce.com' }),
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
    expect(normalizeLegacySiteUrl('https://old.ideadiluce.com')).toBe('https://old.ideadiluce.com/')
  })
})

describe('mapStorefrontSettings', () => {
  it('espone suoni e avviso sito precedente', () => {
    expect(
      mapStorefrontSettings({
        id: 'default',
        soundsEnabled: true,
        legacySiteNoticeEnabled: false,
        legacySiteUrl: 'https://old.ideadiluce.com',
        createdAt: new Date('2026-09-02T00:00:00.000Z'),
        updatedAt: new Date('2026-09-02T00:00:00.000Z'),
      }),
    ).toEqual({
      soundsEnabled: true,
      legacySiteNoticeEnabled: false,
      legacySiteUrl: 'https://old.ideadiluce.com/',
    })
  })

  it('preserva notice on (default go-live)', () => {
    expect(
      mapStorefrontSettings({
        id: 'default',
        soundsEnabled: true,
        legacySiteNoticeEnabled: true,
        legacySiteUrl: '',
        createdAt: new Date('2026-09-02T00:00:00.000Z'),
        updatedAt: new Date('2026-09-02T00:00:00.000Z'),
      }),
    ).toEqual({
      soundsEnabled: true,
      legacySiteNoticeEnabled: true,
      legacySiteUrl: DEFAULT_LEGACY_SITE_URL,
    })
  })
})
