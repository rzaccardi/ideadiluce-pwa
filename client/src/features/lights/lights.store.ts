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
})

export function hydrateLightsStore() {
  if (typeof window === 'undefined' || lightsStore.ready) return
  const { lightsOn, theme } = resolveInitialAppearance()
  lightsStore.on = lightsOn
  applyDocumentTheme(theme)
  lightsStore.ready = true
}

export function setLightsOn(on: boolean) {
  lightsStore.on = on
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
