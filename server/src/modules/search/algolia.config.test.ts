import { describe, expect, it } from 'vitest'
import { getAlgoliaServerConfig } from './algolia.config.js'

describe('getAlgoliaServerConfig', () => {
  it('resta disabilitato senza chiavi', () => {
    const config = getAlgoliaServerConfig({
      ALGOLIA_ENABLED: 'true',
      ALGOLIA_APP_ID: '',
      ALGOLIA_ADMIN_KEY: '',
      ALGOLIA_SEARCH_KEY: '',
    })

    expect(config.enabled).toBe(false)
    expect(config.configured).toBe(false)
  })

  it('si abilita con chiavi complete', () => {
    const config = getAlgoliaServerConfig({
      ALGOLIA_ENABLED: 'true',
      ALGOLIA_APP_ID: 'app123',
      ALGOLIA_ADMIN_KEY: 'admin',
      ALGOLIA_SEARCH_KEY: 'search',
      ALGOLIA_PRODUCTS_INDEX: 'products_it',
    })

    expect(config.enabled).toBe(true)
    expect(config.configured).toBe(true)
    expect(config.productsIndex).toBe('products_it')
  })
})
