import { playUiSound, uiTone } from '@/lib/ui-audio'

/** Chime di conferma add-to-cart: colpo morbido + terza maggiore cristallina. */

const MASTER_GAIN = 0.22

function startCartAddVoice(ctx: AudioContext) {
  const now = ctx.currentTime
  const master = ctx.createGain()
  master.gain.setValueAtTime(MASTER_GAIN, now)
  master.connect(ctx.destination)

  const bodyFilter = ctx.createBiquadFilter()
  bodyFilter.type = 'lowpass'
  bodyFilter.frequency.setValueAtTime(420, now)
  bodyFilter.Q.setValueAtTime(0.7, now)
  bodyFilter.connect(master)

  // Sacchetto: tono basso che decade in frequenza.
  uiTone(ctx, bodyFilter, {
    type: 'sine',
    frequency: 196,
    frequencyEnd: 98,
    start: now,
    duration: 0.16,
    peak: 0.55,
    attack: 0.008,
  })

  // Conferma in E maggiore (E5 → B5), attacco morbido da “vetro”.
  uiTone(ctx, master, {
    type: 'triangle',
    frequency: 659.25,
    start: now + 0.028,
    duration: 0.28,
    peak: 0.28,
    attack: 0.012,
  })
  uiTone(ctx, master, {
    type: 'sine',
    frequency: 987.77,
    start: now + 0.07,
    duration: 0.36,
    peak: 0.18,
    attack: 0.016,
  })
  uiTone(ctx, master, {
    type: 'sine',
    frequency: 1318.51,
    start: now + 0.07,
    duration: 0.22,
    peak: 0.06,
    attack: 0.02,
  })
}

export function playCartAddSound() {
  playUiSound(startCartAddVoice)
}
