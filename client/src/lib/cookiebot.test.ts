import { describe, expect, it } from 'vitest'
import { isLocalCookiebotHost, resolveCookiebotCbid } from './cookiebot'

const PRODUCTION_CBID = 'eb7d2594-3785-4456-8def-e227940921a8'

describe('isLocalCookiebotHost', () => {
  it('riconosce localhost e loopback', () => {
    expect(isLocalCookiebotHost('localhost')).toBe(true)
    expect(isLocalCookiebotHost('LOCALHOST')).toBe(true)
    expect(isLocalCookiebotHost('127.0.0.1')).toBe(true)
    expect(isLocalCookiebotHost('::1')).toBe(true)
    expect(isLocalCookiebotHost('shop.localhost')).toBe(true)
  })

  it('lascia passare i domini pubblici', () => {
    expect(isLocalCookiebotHost('shop.ideadiluce.it')).toBe(false)
    expect(isLocalCookiebotHost('ideadiluce.it')).toBe(false)
  })
})

describe('resolveCookiebotCbid', () => {
  it('non carica Cookiebot in development (evita 404 configuration.js → SyntaxError)', () => {
    expect(
      resolveCookiebotCbid({
        cbid: PRODUCTION_CBID,
        nodeEnv: 'development',
        siteUrl: 'https://shop.ideadiluce.it',
      }),
    ).toBeUndefined()
  })

  it('non carica Cookiebot se SITE_URL è localhost', () => {
    expect(
      resolveCookiebotCbid({
        cbid: PRODUCTION_CBID,
        nodeEnv: 'production',
        siteUrl: 'http://localhost:5273',
      }),
    ).toBeUndefined()
  })

  it('restituisce il CBID in produzione sul dominio reale', () => {
    expect(
      resolveCookiebotCbid({
        cbid: PRODUCTION_CBID,
        nodeEnv: 'production',
        siteUrl: 'https://shop.ideadiluce.it',
      }),
    ).toBe(PRODUCTION_CBID)
  })

  it('restituisce undefined se il CBID manca', () => {
    expect(
      resolveCookiebotCbid({
        cbid: '  ',
        nodeEnv: 'production',
        siteUrl: 'https://shop.ideadiluce.it',
      }),
    ).toBeUndefined()
  })
})
