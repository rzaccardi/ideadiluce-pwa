import { describe, expect, it } from 'vitest'
import {
  catalogSearchEventBodySchema,
  searchAnalyticsListQuerySchema,
  searchAnalyticsStatsQuerySchema,
} from './catalog-search-events.validators.js'

describe('catalogSearchEventBodySchema', () => {
  it('accetta payload minimo valido', () => {
    const parsed = catalogSearchEventBodySchema.parse({ query: 'GU10' })
    expect(parsed).toMatchObject({
      query: 'GU10',
      source: 'inline',
      action: 'submit',
    })
  })

  it('rifiuta query vuota', () => {
    expect(() => catalogSearchEventBodySchema.parse({ query: '   ' })).toThrow()
  })
})

describe('searchAnalyticsListQuerySchema', () => {
  it('applica default paginazione', () => {
    expect(searchAnalyticsListQuerySchema.parse({})).toMatchObject({
      page: 1,
      pageSize: 25,
      days: 30,
    })
  })
})

describe('searchAnalyticsStatsQuerySchema', () => {
  it('applica default giorni', () => {
    expect(searchAnalyticsStatsQuerySchema.parse({})).toMatchObject({ days: 30 })
  })
})
