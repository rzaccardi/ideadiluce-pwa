import { playUiSound, uiTone } from '@/lib/ui-audio'

/** Avvio checkout: swoosh in salita + quinta aperta (A → E), distinto dall’add-to-cart. */

const MASTER_GAIN = 0.2

function startCheckoutVoice(ctx: AudioContext) {
  const now = ctx.currentTime
  const master = ctx.createGain()
  master.gain.setValueAtTime(MASTER_GAIN, now)
  master.connect(ctx.destination)

  const sweepFilter = ctx.createBiquadFilter()
  sweepFilter.type = 'bandpass'
  sweepFilter.frequency.setValueAtTime(700, now)
  sweepFilter.frequency.exponentialRampToValueAtTime(2200, now + 0.16)
  sweepFilter.Q.setValueAtTime(1.1, now)
  sweepFilter.connect(master)

  // Soglia: frequenza che sale, senso di “avanti”.
  uiTone(ctx, sweepFilter, {
    type: 'sine',
    frequency: 280,
    frequencyEnd: 1480,
    start: now,
    duration: 0.16,
    peak: 0.32,
    attack: 0.012,
  })

  // Quinta A4 → E5 (apertura), poi scintilla C#6.
  uiTone(ctx, master, {
    type: 'triangle',
    frequency: 440,
    start: now + 0.05,
    duration: 0.22,
    peak: 0.26,
    attack: 0.014,
  })
  uiTone(ctx, master, {
    type: 'sine',
    frequency: 659.25,
    start: now + 0.12,
    duration: 0.34,
    peak: 0.22,
    attack: 0.018,
  })
  uiTone(ctx, master, {
    type: 'sine',
    frequency: 1108.73,
    start: now + 0.16,
    duration: 0.28,
    peak: 0.08,
    attack: 0.022,
  })
}

export function playCheckoutStartSound() {
  playUiSound(startCheckoutVoice)
}
