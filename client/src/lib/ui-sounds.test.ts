import { describe, expect, it, afterEach } from 'vitest'
import { appStore } from '@/features/app/app.store'
import { areUiSoundsEnabled } from './ui-sounds'

afterEach(() => {
  appStore.soundsEnabled = true
})

describe('areUiSoundsEnabled', () => {
  it('è attivo di default', () => {
    expect(areUiSoundsEnabled()).toBe(true)
  })

  it('rispetta il toggle globale', () => {
    appStore.soundsEnabled = false
    expect(areUiSoundsEnabled()).toBe(false)
  })
})
