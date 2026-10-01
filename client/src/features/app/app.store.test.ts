import { describe, expect, it } from 'vitest'
import { appStore, DEFAULT_LEGACY_SITE_URL } from './app.store'

describe('appStore legacy site defaults', () => {
  it('tiene notice e URL legacy accesi di default', () => {
    expect(appStore.legacySiteNoticeEnabled).toBe(true)
    expect(appStore.legacySiteUrl).toBe(DEFAULT_LEGACY_SITE_URL)
    expect(DEFAULT_LEGACY_SITE_URL).toMatch(/^https:\/\//)
  })
})
