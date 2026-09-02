import { describe, expect, it } from 'vitest'
import { mapMerchantCenterSettings } from './merchant-center.settings.js'
import { merchantCenterSettingsPatchSchema } from './merchant-center.validators.js'

describe('merchantCenterSettingsPatchSchema', () => {
  it('accetta un toggle e la categoria Google', () => {
    expect(
      merchantCenterSettingsPatchSchema.parse({
        enabled: false,
        googleProductCategory: '594',
      }),
    ).toEqual({ enabled: false, googleProductCategory: '594' })
  })

  it('rifiuta body vuoto', () => {
    expect(() => merchantCenterSettingsPatchSchema.parse({})).toThrow()
  })

  it('normalizza il paese ISO', () => {
    expect(merchantCenterSettingsPatchSchema.parse({ shippingCountry: 'it' })).toEqual({
      shippingCountry: 'it',
    })
  })
})

describe('mapMerchantCenterSettings', () => {
  it('espone i campi gestiti dal BO', () => {
    expect(
      mapMerchantCenterSettings({
        id: 'default',
        enabled: true,
        includeOutOfStock: false,
        expandVariants: true,
        googleProductCategory: ' 594 ',
        shippingCountry: 'it',
        shippingPriceCents: 0,
        brandFallback: ' Idea di Luce ',
        createdAt: new Date('2026-09-02T00:00:00.000Z'),
        updatedAt: new Date('2026-09-02T00:00:00.000Z'),
      }),
    ).toEqual({
      enabled: true,
      includeOutOfStock: false,
      expandVariants: true,
      googleProductCategory: '594',
      shippingCountry: 'IT',
      shippingPriceCents: 0,
      brandFallback: 'Idea di Luce',
    })
  })
})
