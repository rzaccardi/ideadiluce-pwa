import { describe, expect, it } from 'vitest'
import { mapStorefrontSettings } from './storefront-settings.js'
import { storefrontSettingsPatchSchema } from './storefront-settings.validators.js'

describe('storefrontSettingsPatchSchema', () => {
  it('accetta soundsEnabled boolean', () => {
    expect(storefrontSettingsPatchSchema.parse({ soundsEnabled: false })).toEqual({
      soundsEnabled: false,
    })
  })

  it('rifiuta body vuoto', () => {
    expect(() => storefrontSettingsPatchSchema.parse({})).toThrow()
  })
})

describe('mapStorefrontSettings', () => {
  it('espone solo il flag pubblico', () => {
    expect(
      mapStorefrontSettings({
        id: 'default',
        soundsEnabled: true,
        createdAt: new Date('2026-09-02T00:00:00.000Z'),
        updatedAt: new Date('2026-09-02T00:00:00.000Z'),
      }),
    ).toEqual({ soundsEnabled: true })
  })
})
