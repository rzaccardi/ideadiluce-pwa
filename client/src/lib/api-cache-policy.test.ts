import { describe, expect, it } from 'vitest'
import {
  isPrivateApiPath,
  privateApiFetchInit,
  PUBLIC_API_REVALIDATE_SECONDS,
  serverApiFetchInit,
} from './api-cache-policy'

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

  it('usa revalidate Data Cache per GET pubblici lato server', () => {
    expect(serverApiFetchInit('/api/v1/catalog/bootstrap')).toEqual({
      next: { revalidate: PUBLIC_API_REVALIDATE_SECONDS },
    })
    expect(serverApiFetchInit('/api/v2/products?page=1')).toEqual({
      next: { revalidate: PUBLIC_API_REVALIDATE_SECONDS },
    })
  })

  it('forza no-store sulle API private lato server', () => {
    expect(serverApiFetchInit('/api/v1/cart')).toEqual({ cache: 'no-store' })
  })
})
