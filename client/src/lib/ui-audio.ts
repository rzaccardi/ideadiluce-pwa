/** Web Audio condiviso per feedback UI (add-to-cart, avvio checkout, …). */

import { areUiSoundsEnabled } from '@/lib/ui-sounds'

let audioCtx: AudioContext | null = null

export function getUiAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctx =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctx) return null
  if (!audioCtx) audioCtx = new Ctx()
  return audioCtx
}

export function uiTone(
  ctx: AudioContext,
  destination: AudioNode,
  options: {
    type: OscillatorType
    frequency: number
    start: number
    duration: number
    peak: number
    attack: number
    frequencyEnd?: number
  },
) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = options.type
  osc.frequency.setValueAtTime(options.frequency, options.start)
  if (options.frequencyEnd != null) {
    osc.frequency.exponentialRampToValueAtTime(options.frequencyEnd, options.start + options.duration)
  }
  gain.gain.setValueAtTime(0.0001, options.start)
  gain.gain.exponentialRampToValueAtTime(options.peak, options.start + options.attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, options.start + options.duration)
  osc.connect(gain)
  gain.connect(destination)
  osc.start(options.start)
  osc.stop(options.start + options.duration + 0.02)
}

export function playUiSound(startVoice: (ctx: AudioContext) => void) {
  if (!areUiSoundsEnabled()) return
  if (typeof window === 'undefined' || document.hidden) return

  try {
    const ctx = getUiAudioContext()
    if (!ctx) return
    if (ctx.state === 'suspended') {
      void ctx.resume().then(() => {
        if (!document.hidden && areUiSoundsEnabled()) startVoice(ctx)
      })
      return
    }
    startVoice(ctx)
  } catch {
    /* Autoplay bloccato o Web Audio assente: il feedback visivo resta. */
  }
}
