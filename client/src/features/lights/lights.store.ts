import { proxy } from 'valtio'
import { IDEADILUCE_LIGHTS_KEY } from '@/lib/storage-keys'

export const lightsStore = proxy({
  on: false,
  ready: false,
})

export function hydrateLightsStore() {
  if (typeof window === 'undefined' || lightsStore.ready) return
  try {
    lightsStore.on = window.localStorage.getItem(IDEADILUCE_LIGHTS_KEY) === '1'
  } catch {
    lightsStore.on = false
  }
  lightsStore.ready = true
}

export function setLightsOn(on: boolean) {
  lightsStore.on = on
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(IDEADILUCE_LIGHTS_KEY, on ? '1' : '0')
  } catch {
    /* private mode / quota */
  }
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
