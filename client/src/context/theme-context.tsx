'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  IDEADILUCE_THEME_KEY,
  LEGACY_STORAGE_KEYS,
} from '@/lib/storage-keys'
import { readWithMigration } from '@/lib/storage-migrate'

export type SiteTheme = 'light' | 'dark'

const THEME_LEGACY_KEYS = LEGACY_STORAGE_KEYS[IDEADILUCE_THEME_KEY]

const THEME_CYCLE: SiteTheme[] = ['light', 'dark']

export const SITE_THEMES = THEME_CYCLE

const DEFAULT_THEME: SiteTheme = 'light'

function isSiteTheme(value: string | null): value is SiteTheme {
  return value === 'light' || value === 'dark'
}

/** Migra eventuale tema `classic` salvato → `light` (nero). */
function normalizeStoredTheme(value: string | null): SiteTheme | null {
  if (isSiteTheme(value)) return value
  if (value === 'classic') return 'light'
  return null
}

function readStoredTheme(): SiteTheme | null {
  if (typeof window === 'undefined') return null
  const stored = readWithMigration(window.localStorage, IDEADILUCE_THEME_KEY, THEME_LEGACY_KEYS)
  return normalizeStoredTheme(stored)
}

function getSystemTheme(): SiteTheme {
  return DEFAULT_THEME
}

export function resolveTheme(): SiteTheme {
  return readStoredTheme() ?? getSystemTheme()
}

export function getNextTheme(theme: SiteTheme): SiteTheme {
  const index = THEME_CYCLE.indexOf(theme)
  return THEME_CYCLE[(index + 1) % THEME_CYCLE.length]
}

type ThemeContextValue = {
  theme: SiteTheme
  isDark: boolean
  setTheme: (theme: SiteTheme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function applyTheme(theme: SiteTheme) {
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme === 'dark' ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<SiteTheme>(DEFAULT_THEME)

  useEffect(() => {
    const resolved = resolveTheme()
    setThemeState(resolved)
    applyTheme(resolved)
    // Allinea storage se c'era ancora `classic`
    if (window.localStorage.getItem(IDEADILUCE_THEME_KEY) === 'classic') {
      window.localStorage.setItem(IDEADILUCE_THEME_KEY, 'light')
    }

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onSystemChange = () => {
      if (readStoredTheme()) return
      const next = getSystemTheme()
      setThemeState(next)
      applyTheme(next)
    }

    media.addEventListener('change', onSystemChange)
    return () => media.removeEventListener('change', onSystemChange)
  }, [])

  const setTheme = useCallback((next: SiteTheme) => {
    window.localStorage.setItem(IDEADILUCE_THEME_KEY, next)
    applyTheme(next)
    setThemeState(next)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const next = getNextTheme(current)
      window.localStorage.setItem(IDEADILUCE_THEME_KEY, next)
      applyTheme(next)
      return next
    })
  }, [])

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === 'dark',
      setTheme,
      toggleTheme,
    }),
    [theme, setTheme, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme richiede ThemeProvider')
  return ctx
}
