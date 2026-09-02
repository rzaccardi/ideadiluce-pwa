import { describe, expect, it } from 'vitest'
import {
  catalogIndexRefreshSlot,
  shouldRunScheduledCatalogIndexSync,
} from './odooCatalogIndex.scheduler.js'

describe('odooCatalogIndex scheduler', () => {
  it('esegue alle 03:00 Europe/Rome se lo slot non è già stato fatto', () => {
    // 2026-09-02 03:00:30 CEST = 01:00:30 UTC
    const now = new Date('2026-09-02T01:00:30.000Z')
    const { shouldRun, slot } = shouldRunScheduledCatalogIndexSync(now, null)
    expect(shouldRun).toBe(true)
    expect(slot).toBe(catalogIndexRefreshSlot(now))
    expect(slot).toBe('2026-09-02T03')
  })

  it('esegue alle 15:00 Europe/Rome', () => {
    // 2026-09-02 15:00:10 CEST = 13:00:10 UTC
    const now = new Date('2026-09-02T13:00:10.000Z')
    const { shouldRun, slot } = shouldRunScheduledCatalogIndexSync(now, null)
    expect(shouldRun).toBe(true)
    expect(slot).toBe('2026-09-02T15')
  })

  it('non riesegue lo stesso slot', () => {
    const now = new Date('2026-09-02T01:01:00.000Z')
    const { shouldRun } = shouldRunScheduledCatalogIndexSync(now, '2026-09-02T03')
    expect(shouldRun).toBe(false)
  })

  it('non esegue fuori dalla finestra', () => {
    const now = new Date('2026-09-02T08:30:00.000Z')
    const { shouldRun } = shouldRunScheduledCatalogIndexSync(now, null)
    expect(shouldRun).toBe(false)
  })
})
