import { describe, expect, it } from 'vitest'
import {
  extractProductSlugFromPath,
  listWordpressIndexedProductSlugs,
  listWordpressSitemapPaths,
  normalizeSitemapPathKey,
} from './wordpress-sitemap-paths.js'

describe('wordpress-sitemap-paths', () => {
  it('include tutti i path indicizzati tranne junk', () => {
    const paths = listWordpressSitemapPaths()
    expect(paths.length).toBeGreaterThan(1100)
    expect(paths).not.toContain('/et_tb_item_type/template')
    expect(paths).toContain('/prodotto/wheel-ideal-lux')
    expect(paths).toContain('/categoria-prodotto/illuminazione-arredo/sospensione')
  })

  it('estrae slug prodotto per deduplica Odoo', () => {
    expect(extractProductSlugFromPath('/prodotto/foo/')).toBe('foo')
    expect(normalizeSitemapPathKey('/prodotto/foo/')).toBe('/prodotto/foo')
    const slugs = listWordpressIndexedProductSlugs()
    expect(slugs.has('wheel-ideal-lux')).toBe(true)
  })
})
