import { describe, expect, it } from 'vitest'
import { isPrivateApiPath, privateApiFetchInit } from './api-cache-policy'

describe('api-cache-policy', () => {
  it('marca come private le API di carrello, checkout e utente', () => {
    expect(isPrivateApiPath('/api/v1/cart')).toBe(true)
    expect(isPrivateApiPath('/api/v1/checkout/draft')).toBe(true)
    expect(isPrivateApiPath('/api/v1/auth/refresh')).toBe(true)
    expect(privateApiFetchInit('/api/v1/users/me')).toEqual({ cache: 'no-store' })
  })

  it('non applica no-store al catalogo pubblico', () => {
    expect(isPrivateApiPath('/api/v1/catalog/bootstrap')).toBe(false)
    expect(privateApiFetchInit('/api/v1/catalog/bootstrap')).toBeUndefined()
  })
})
