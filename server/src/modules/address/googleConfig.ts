import { env } from '../../config/env.js'

const PLACEHOLDER_KEYS = new Set([
  'la_tua_chiave',
  'your_api_key',
  'changeme',
  'xxx',
])

/** Chiave Google Places configurata e non placeholder. */
export function isGoogleMapsConfigured(): boolean {
  const key = env.GOOGLE_MAPS_API_KEY?.trim()
  if (!key || key.length < 20) return false
  if (PLACEHOLDER_KEYS.has(key.toLowerCase())) return false
  return true
}

export function googleMapsApiKey(): string | null {
  return isGoogleMapsConfigured() ? env.GOOGLE_MAPS_API_KEY!.trim() : null
}
