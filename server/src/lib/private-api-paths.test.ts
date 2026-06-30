import { describe, expect, it } from 'vitest'
import { isPrivateApiPath } from './private-api-paths.js'

describe('isPrivateApiPath', () => {
  it('riconosce carrello, checkout e utente', () => {
    expect(isPrivateApiPath('/api/v1/cart')).toBe(true)
    expect(isPrivateApiPath('/api/v1/cart?reprice=1')).toBe(true)
    expect(isPrivateApiPath('/api/v1/checkout/session/abc')).toBe(true)
    expect(isPrivateApiPath('/api/v1/auth/me')).toBe(true)
    expect(isPrivateApiPath('/api/v1/users/me')).toBe(true)
    expect(isPrivateApiPath('/cart')).toBe(true)
  })

  it('lascia pubblico il catalogo', () => {
    expect(isPrivateApiPath('/api/v1/catalog/bootstrap')).toBe(false)
    expect(isPrivateApiPath('/api/v1/catalog/brands')).toBe(false)
    expect(isPrivateApiPath('/api/v1/site/guides')).toBe(false)
  })
})
