import { describe, expect, it } from 'vitest'
import { appStore } from './app.store'

describe('appStore defaults', () => {
  it('tiene i suoni accesi di default', () => {
    expect(appStore.soundsEnabled).toBe(true)
  })
})
