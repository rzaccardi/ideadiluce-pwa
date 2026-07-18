import { describe, expect, it } from 'vitest'
import { buildTechnicalProductRedirectUrl, getDesignTenant } from './site-tenants.js'

describe('site-tenants', () => {
  it('espone tenant design con slug arredo', () => {
    const design = getDesignTenant()
    expect(design.id).toBe('design')
    expect(design.catalogRootCategorySlug).toBe('arredo')
    expect(design.publicUrl).toMatch(/^https:\/\//)
  })

  it('non genera redirect cross-domain senza TECHNICAL_SITE_URL', () => {
    expect(buildTechnicalProductRedirectUrl('lampadina-gu10')).toBeNull()
  })
})
