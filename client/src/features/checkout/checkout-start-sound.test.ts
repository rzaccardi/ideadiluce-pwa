import { describe, expect, it, vi, afterEach } from 'vitest'
import { playCheckoutStartSound } from './checkout-start-sound'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('playCheckoutStartSound', () => {
  it('non lancia se Web Audio non è disponibile', () => {
    vi.stubGlobal('window', { AudioContext: undefined, webkitAudioContext: undefined })
    vi.stubGlobal('document', { hidden: false })
    expect(() => playCheckoutStartSound()).not.toThrow()
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
    playCheckoutStartSound()
    expect(createOscillator).not.toHaveBeenCalled()
  })
})
