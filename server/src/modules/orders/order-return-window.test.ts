import { describe, expect, it } from 'vitest'
import { computeReturnWindow, extendToNextWeekday, returnWindowExpiresOn } from './order-return-window.js'

describe('returnWindowExpiresOn', () => {
  it('conta 14 giorni di calendario dalla consegna', () => {
    expect(returnWindowExpiresOn(new Date('2026-08-03T10:00:00+02:00'))).toBe('2026-08-17')
  })

  it('slitta a lunedì se il 14° giorno è domenica', () => {
    expect(extendToNextWeekday('2026-08-16')).toBe('2026-08-17')
  })
})

describe('computeReturnWindow', () => {
  it('resta richiedibile senza data di consegna', () => {
    const window = computeReturnWindow(null, new Date('2026-09-02T12:00:00Z'))
    expect(window.eligible).toBe(true)
    expect(window.reason).toBe('not_delivered')
  })

  it('blocca il reso dopo 14 giorni dalla consegna', () => {
    const window = computeReturnWindow(
      '2026-08-01T14:00:00+02:00',
      new Date('2026-08-20T10:00:00+02:00'),
    )
    expect(window.eligible).toBe(false)
    expect(window.reason).toBe('expired')
  })

  it('resta aperto entro i 14 giorni', () => {
    const window = computeReturnWindow(
      '2026-08-20T14:00:00+02:00',
      new Date('2026-08-25T10:00:00+02:00'),
    )
    expect(window.eligible).toBe(true)
    expect(window.reason).toBe('open')
    expect(window.daysRemaining).toBeGreaterThan(0)
  })
})
