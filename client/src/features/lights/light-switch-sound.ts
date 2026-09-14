import { areUiSoundsEnabled } from '@/lib/ui-sounds'
import { getUiAudioContext, playUiSound } from '@/lib/ui-audio'

const SWITCH_SRC = '/site/audio/light-switch.mp3'
const MASTER_GAIN = 0.72

let decoded: AudioBuffer | null = null
let decodePromise: Promise<AudioBuffer | null> | null = null
let playing: AudioBufferSourceNode | null = null

async function loadSwitchBuffer(ctx: AudioContext): Promise<AudioBuffer | null> {
  if (decoded) return decoded
  if (!decodePromise) {
    decodePromise = fetch(SWITCH_SRC)
      .then((response) => {
        if (!response.ok) throw new Error('light-switch sample missing')
        return response.arrayBuffer()
      })
      .then((bytes) => ctx.decodeAudioData(bytes.slice(0)))
      .then((buffer) => {
        decoded = buffer
        return buffer
      })
      .catch(() => {
        decodePromise = null
        return null
      })
  }
  return decodePromise
}

function startSwitchSample(ctx: AudioContext, buffer: AudioBuffer) {
  if (playing) {
    try {
      playing.stop()
    } catch {
      /* già fermato */
    }
    playing = null
  }

  const src = ctx.createBufferSource()
  src.buffer = buffer
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(MASTER_GAIN, ctx.currentTime)
  src.connect(gain)
  gain.connect(ctx.destination)
  src.onended = () => {
    if (playing === src) playing = null
  }
  src.start()
  playing = src
}

/** Precarica il campione così il primo click non aspetta il decode. */
export function prefetchLightSwitchSound() {
  if (typeof window === 'undefined' || !areUiSoundsEnabled()) return
  const ctx = getUiAudioContext()
  if (!ctx) return
  void loadSwitchBuffer(ctx)
}

export function playLightSwitchSound(_turningOn: boolean) {
  playUiSound((ctx) => {
    void loadSwitchBuffer(ctx).then((buffer) => {
      if (!buffer || document.hidden || !areUiSoundsEnabled()) return
      startSwitchSample(ctx, buffer)
    })
  })
}
