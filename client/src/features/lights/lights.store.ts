import { proxy } from 'valtio'
import {
  applyDocumentTheme,
  persistAppearance,
  resolveInitialAppearance,
  themeFromLights,
} from '@/lib/appearance'

export const lightsStore = proxy({
  on: false,
  ready: false,
  /** Incrementato solo sul toggle manuale: abilita lo stagger a ondate. */
  waveNonce: 0,
})

function readDomLightsPreference(): boolean | null {
  if (typeof document === 'undefined') return null
  const raw = document.documentElement.dataset.lights
  if (raw === 'on') return true
  if (raw === 'off') return false
  return null
}

export function hydrateLightsStore() {
  if (typeof window === 'undefined' || lightsStore.ready) return
  const fromDom = readDomLightsPreference()
  if (fromDom != null) {
    lightsStore.on = fromDom
    applyDocumentTheme(themeFromLights(fromDom))
  } else {
    const { lightsOn, theme } = resolveInitialAppearance()
    lightsStore.on = lightsOn
    applyDocumentTheme(theme)
  }
  lightsStore.ready = true
}

export function setLightsOn(on: boolean) {
  lightsStore.on = on
  lightsStore.waveNonce += 1
  const theme = themeFromLights(on)
  applyDocumentTheme(theme)
  persistAppearance(on)
}

export function toggleLights() {
  setLightsOn(!lightsStore.on)
}

/** Ritardo per-card, così le luci si accendono a ondate invece che tutte insieme. */
export function cardLightsDelayMs(slug: string | null | undefined): number {
  if (!slug) return 0
  let hash = 0
  for (let i = 0; i < slug.length; i += 1) {
    hash = (hash * 33 + slug.charCodeAt(i)) >>> 0
  }
  return 40 + (hash % 280)
}
