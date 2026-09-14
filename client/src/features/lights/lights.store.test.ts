import { describe, expect, it } from 'vitest'
import { cardLightsDelayMs } from './lights.store'

describe('cardLightsDelayMs', () => {
  it('è stabile per lo stesso slug e compreso nel range', () => {
    const a = cardLightsDelayMs('la-petite-floor-artemide')
    const b = cardLightsDelayMs('la-petite-floor-artemide')
    expect(a).toBe(b)
    expect(a).toBeGreaterThanOrEqual(40)
    expect(a).toBeLessThan(40 + 280)
  })

  it('varia tra slug diversi', () => {
    expect(cardLightsDelayMs('la-petite-floor-artemide')).not.toBe(cardLightsDelayMs('pirce-sospensione-artemide'))
  })
})
