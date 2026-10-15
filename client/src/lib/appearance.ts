import {
  IDEADILUCE_LIGHTS_KEY,
  IDEADILUCE_THEME_KEY,
  LEGACY_STORAGE_KEYS,
} from '@/lib/storage-keys'
import { readWithMigration } from '@/lib/storage-migrate'

export type SiteTheme = 'light' | 'dark'

export function themeFromLights(on: boolean): SiteTheme {
  return on ? 'dark' : 'light'
}

export function lightsFromTheme(theme: SiteTheme): boolean {
  return theme === 'dark'
}

export function applyDocumentTheme(theme: SiteTheme) {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme === 'dark' ? 'dark' : 'light'
}

function parseTheme(raw: string | null): SiteTheme | null {
  return raw === 'light' || raw === 'dark' ? raw : null
}

function parseLights(raw: string | null): boolean | null {
  if (raw === '1') return true
  if (raw === '0') return false
  return null
}

function getSystemTheme(): SiteTheme {
  if (typeof window === 'undefined') return 'light'
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

/** Preferenza unica: luci + tema restano allineati (on ↔ dark). */
export function resolveInitialAppearance(storage?: Storage): {
  lightsOn: boolean
  theme: SiteTheme
} {
  if (typeof window === 'undefined' && !storage) {
    return { lightsOn: false, theme: 'light' }
  }
  const store = storage ?? window.localStorage
  try {
    const lights = parseLights(store.getItem(IDEADILUCE_LIGHTS_KEY))
    if (lights != null) {
      return { lightsOn: lights, theme: themeFromLights(lights) }
    }

    const theme = parseTheme(
      readWithMigration(store, IDEADILUCE_THEME_KEY, LEGACY_STORAGE_KEYS[IDEADILUCE_THEME_KEY]),
    )
    if (theme) {
      return { lightsOn: lightsFromTheme(theme), theme }
    }
  } catch {
    /* private mode / quota */
  }

  const theme = getSystemTheme()
  return { lightsOn: lightsFromTheme(theme), theme }
}

export function persistAppearance(lightsOn: boolean, storage?: Storage) {
  if (typeof window === 'undefined' && !storage) return
  const store = storage ?? window.localStorage
  const theme = themeFromLights(lightsOn)
  try {
    store.setItem(IDEADILUCE_LIGHTS_KEY, lightsOn ? '1' : '0')
    store.setItem(IDEADILUCE_THEME_KEY, theme)
  } catch {
    /* private mode / quota */
  }
}
