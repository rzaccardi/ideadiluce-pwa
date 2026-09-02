import { describe, expect, it } from 'vitest'
import {
  classifyPathKind,
  classifyReferrer,
  isBotUserAgent,
  isProbePath,
  normalizeNotFoundPath,
  normalizeQueryString,
  stripLocalePrefix,
} from './not-found.normalize.js'

describe('normalizeNotFoundPath', () => {
  it('normalizza slash, query e trailing slash', () => {
    expect(normalizeNotFoundPath('/prodotto/foo/?utm=1')).toBe('/prodotto/foo')
    expect(normalizeNotFoundPath('prodotto/foo')).toBe('/prodotto/foo')
    expect(normalizeNotFoundPath('https://shop.ideadiluce.it/en/prodotto/x/')).toBe('/en/prodotto/x')
  })

  it('rifiuta asset interni e path vuoti', () => {
    expect(normalizeNotFoundPath('/_next/static/chunk.js')).toBeNull()
    expect(normalizeNotFoundPath('/api/v1/health')).toBeNull()
    expect(normalizeNotFoundPath('   ')).toBeNull()
  })
})

describe('normalizeQueryString', () => {
  it('toglie il punto interrogativo e tronca', () => {
    expect(normalizeQueryString('?a=1')).toBe('a=1')
    expect(normalizeQueryString('')).toBeNull()
  })
})

describe('stripLocalePrefix', () => {
  it('rimuove il prefisso lingua', () => {
    expect(stripLocalePrefix('/en/prodotto/x')).toBe('/prodotto/x')
    expect(stripLocalePrefix('/de')).toBe('/')
    expect(stripLocalePrefix('/prodotto/x')).toBe('/prodotto/x')
  })
})

describe('isBotUserAgent', () => {
  it('riconosce crawler comuni', () => {
    expect(isBotUserAgent('Mozilla/5.0 (compatible; Googlebot/2.1)')).toBe(true)
    expect(isBotUserAgent('UptimeRobot/2.0')).toBe(true)
    expect(isBotUserAgent('Mozilla/5.0 (Macintosh) Chrome/120')).toBe(false)
  })
})

describe('isProbePath / classifyPathKind', () => {
  it('marca probe WordPress e file sospetti', () => {
    expect(isProbePath('/wp-admin/')).toBe(true)
    expect(isProbePath('/en/xmlrpc.php')).toBe(true)
    expect(isProbePath('/prodotto/lampada')).toBe(false)
  })

  it('classifica URL di catalogo e legacy WP', () => {
    expect(classifyPathKind('/prodotto/foo')).toBe('product')
    expect(classifyPathKind('/en/categoria-prodotto/lampade')).toBe('category')
    expect(classifyPathKind('/brand/flos')).toBe('brand')
    expect(classifyPathKind('/guide/luce-calda')).toBe('guide')
    expect(classifyPathKind('/ambienti/soggiorno')).toBe('room')
    expect(classifyPathKind('/wp-login.php')).toBe('probe')
    expect(classifyPathKind('/chi-siamo')).toBe('other')
  })
})

describe('classifyReferrer', () => {
  it('distingue nessuno, interno, legacy e esterno', () => {
    expect(classifyReferrer(null, ['shop.ideadiluce.it']).referrerKind).toBe('none')
    expect(
      classifyReferrer('https://shop.ideadiluce.it/negozio', ['shop.ideadiluce.it']).referrerKind,
    ).toBe('internal')
    expect(
      classifyReferrer('https://old.ideadiluce.it/product/x', ['shop.ideadiluce.it']).referrerKind,
    ).toBe('legacy')
    expect(
      classifyReferrer('https://old.ideadiluce.com/product/x', ['shop.ideadiluce.it']).referrerKind,
    ).toBe('legacy')
    expect(classifyReferrer('https://www.google.com/', ['shop.ideadiluce.it'])).toMatchObject({
      referrerKind: 'external',
      referrerHost: 'google.com',
    })
  })
})
