import { describe, expect, it } from 'vitest'
import {
  CatalogIndexThrottle,
  clampInt,
  computeBackoffMs,
} from './odoo-catalog-index-throttle.js'

describe('catalog index throttle', () => {
  it('clampInt rispetta i bound', () => {
    expect(clampInt(5, 1, 3)).toBe(3)
    expect(clampInt(-1, 1, 3)).toBe(1)
    expect(clampInt(2.9, 1, 3)).toBe(2)
  })

  it('preferisce Retry-After nel backoff', () => {
    expect(
      computeBackoffMs({
        attempt: 1,
        baseDelayMs: 1_000,
        maxDelayMs: 30_000,
        retryAfterMs: 4_500,
      }),
    ).toBe(4_500)
  })

  it('su 429 riduce concurrency a 1 e alza il delay', () => {
    const t = new CatalogIndexThrottle({
      initialConcurrency: 2,
      minConcurrency: 1,
      maxConcurrency: 2,
      initialDelayMs: 1_000,
      minDelayMs: 500,
      maxDelayMs: 30_000,
    })
    expect(t.currentConcurrency()).toBe(2)
    const wait = t.onRateLimit(8_000)
    expect(t.currentConcurrency()).toBe(1)
    expect(wait).toBeGreaterThanOrEqual(8_000)
    expect(t.currentDelayMs()).toBeGreaterThanOrEqual(8_000)
  })

  it('dopo streak di successi riduce lentamente il delay', () => {
    const t = new CatalogIndexThrottle({
      initialConcurrency: 1,
      minConcurrency: 1,
      maxConcurrency: 2,
      initialDelayMs: 1_000,
      minDelayMs: 500,
      maxDelayMs: 30_000,
    })
    t.onRateLimit(null)
    const afterLimit = t.currentDelayMs()
    expect(afterLimit).toBeGreaterThan(1_000)
    for (let i = 0; i < 12; i += 1) t.onSuccess()
    expect(t.currentDelayMs()).toBeLessThan(afterLimit)
  })
})
