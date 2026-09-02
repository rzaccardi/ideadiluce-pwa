import { describe, expect, it } from 'vitest'
import {
  buildRecommendedMonitors,
  matchRecommendedMonitor,
  normalizeMonitorUrl,
  recommendedFriendlyName,
} from './uptime-recommended.js'

describe('uptime-recommended', () => {
  it('normalizza host, slash e porta implicita', () => {
    expect(normalizeMonitorUrl('https://Shop.IdeaDiLuce.it/')).toBe('https://shop.ideadiluce.it/')
    expect(normalizeMonitorUrl('https://shop.ideadiluce.it:443/api/v1/health')).toBe(
      'https://shop.ideadiluce.it/api/v1/health',
    )
    expect(normalizeMonitorUrl('https://shop.ideadiluce.it/sitemap.xml')).toBe(
      'https://shop.ideadiluce.it/sitemap.xml',
    )
  })

  it('costruisce i monitor su shop, API, catalogo, Odoo e BO', () => {
    const specs = buildRecommendedMonitors({
      publicSiteUrl: 'https://shop.ideadiluce.it/',
      adminOrigin: 'https://admin.example.ondigitalocean.app',
      odooBaseUrl: 'https://tlbdb.odoo.com',
      apiPublicUrl: 'https://api.example.ondigitalocean.app',
    })
    const keys = specs.map((s) => s.key)
    expect(keys).toEqual([
      'shop',
      'api-site',
      'catalog',
      'sitemap',
      'merchant-feed',
      'api-direct',
      'odoo',
      'admin',
    ])
    expect(specs.find((s) => s.key === 'shop')?.keywordValue).toBe('Idea di Luce')
    expect(specs.find((s) => s.key === 'api-site')?.url).toBe(
      'https://shop.ideadiluce.it/api/v1/health',
    )
    expect(specs.find((s) => s.key === 'odoo')?.url).toBe('https://tlbdb.odoo.com')
    expect(specs.find((s) => s.key === 'api-direct')?.friendlyName).toBe(
      recommendedFriendlyName('API (diretta)'),
    )
  })

  it('ignora URL localhost non raggiungibili da UptimeRobot', () => {
    const specs = buildRecommendedMonitors({
      publicSiteUrl: 'http://localhost:3000',
      adminOrigin: 'http://localhost:5274',
      odooBaseUrl: 'https://tlbdb.odoo.com',
      apiPublicUrl: 'http://127.0.0.1:4100',
    })
    expect(specs.map((s) => s.key)).toEqual(['odoo'])
  })

  it('non duplica il monitor API diretta se coincide col path shop', () => {
    const specs = buildRecommendedMonitors({
      publicSiteUrl: 'https://shop.ideadiluce.it',
      adminOrigin: 'https://admin.example.app',
      apiPublicUrl: 'https://shop.ideadiluce.it/api/v1',
    })
    expect(specs.some((s) => s.key === 'api-direct')).toBe(false)
  })

  it('riconosce un monitor già creato per URL o nome', () => {
    const spec = buildRecommendedMonitors({
      publicSiteUrl: 'https://shop.ideadiluce.it',
      adminOrigin: 'https://admin.example.app',
    }).find((s) => s.key === 'shop')
    if (!spec) throw new Error('missing shop spec')

    expect(
      matchRecommendedMonitor(spec, [
        { id: 1, url: 'https://shop.ideadiluce.it/', friendlyName: 'Altro' },
      ])?.id,
    ).toBe(1)

    expect(
      matchRecommendedMonitor(spec, [
        { id: 9, url: 'https://altro.example', friendlyName: spec.friendlyName },
      ])?.id,
    ).toBe(9)

    expect(
      matchRecommendedMonitor(spec, [
        { id: 2, url: 'https://altro.example', friendlyName: 'No' },
      ]),
    ).toBeNull()
  })
})
