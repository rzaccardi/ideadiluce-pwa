import { describe, expect, it, vi, afterEach } from 'vitest'
import { appStore } from '@/features/app/app.store'
import { playCartAddSound } from './cart-add-sound'

afterEach(() => {
  appStore.soundsEnabled = true
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('playCartAddSound', () => {
  it('non lancia se Web Audio non è disponibile', () => {
    vi.stubGlobal('window', { AudioContext: undefined, webkitAudioContext: undefined })
    vi.stubGlobal('document', { hidden: false })
    expect(() => playCartAddSound()).not.toThrow()
  })

  it('non riproduce se i suoni sono disattivati dal BO', () => {
    const createOscillator = vi.fn()
    appStore.soundsEnabled = false
    vi.stubGlobal('document', { hidden: false })
    vi.stubGlobal(
      'window',
      {
        AudioContext: class {
          createOscillator = createOscillator
          createGain() {
            return { gain: { setValueAtTime: vi.fn() }, connect: vi.fn() }
          }
          get currentTime() {
            return 0
          }
          get state() {
            return 'running'
          }
        },
      },
    )
    playCartAddSound()
    expect(createOscillator).not.toHaveBeenCalled()
  })

  it('non riproduce se il documento è in background', () => {
    const createOscillator = vi.fn()
    vi.stubGlobal('document', { hidden: true })
    vi.stubGlobal(
      'window',
      {
        AudioContext: class {
          createOscillator = createOscillator
          createGain() {
            return { gain: { setValueAtTime: vi.fn() }, connect: vi.fn() }
          }
          get currentTime() {
            return 0
          }
          get state() {
            return 'running'
          }
        },
      },
    )
    playCartAddSound()
    expect(createOscillator).not.toHaveBeenCalled()
  })
})
