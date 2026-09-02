import { describe, expect, it } from 'vitest'
import {
  notFoundAdminHitsQuerySchema,
  notFoundAdminListQuerySchema,
  notFoundAdminStatsQuerySchema,
  notFoundEventBodySchema,
} from './not-found.validators.js'

describe('notFoundEventBodySchema', () => {
  it('accetta payload minimo', () => {
    expect(notFoundEventBodySchema.parse({ path: '/prodotto/x' })).toMatchObject({
      path: '/prodotto/x',
    })
  })

  it('rifiuta path vuoto', () => {
    expect(() => notFoundEventBodySchema.parse({ path: '   ' })).toThrow()
  })
})

describe('notFoundAdminListQuerySchema', () => {
  it('applica default e parse booleani query', () => {
    expect(notFoundAdminListQuerySchema.parse({})).toMatchObject({
      page: 1,
      pageSize: 25,
      days: 30,
      hideBots: false,
      hideProbes: true,
      referrerKind: 'all',
      pathKind: 'all',
    })
    expect(notFoundAdminListQuerySchema.parse({ hideBots: 'true', hideProbes: '0' })).toMatchObject({
      hideBots: true,
      hideProbes: false,
    })
    expect(notFoundAdminListQuerySchema.parse({ hideBots: true, hideProbes: false })).toMatchObject({
      hideBots: true,
      hideProbes: false,
    })
    const once = notFoundAdminListQuerySchema.parse({ hideBots: 'true', hideProbes: '1' })
    expect(notFoundAdminListQuerySchema.parse(once)).toMatchObject({
      hideBots: true,
      hideProbes: true,
    })
  })
})

describe('notFoundAdminStatsQuerySchema', () => {
  it('applica default giorni', () => {
    expect(notFoundAdminStatsQuerySchema.parse({})).toMatchObject({ days: 30 })
  })
})

describe('notFoundAdminHitsQuerySchema', () => {
  it('richiede path', () => {
    expect(() => notFoundAdminHitsQuerySchema.parse({})).toThrow()
    expect(notFoundAdminHitsQuerySchema.parse({ path: '/prodotto/x' })).toMatchObject({
      path: '/prodotto/x',
      page: 1,
    })
  })
})
