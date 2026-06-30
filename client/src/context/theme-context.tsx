'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  IDEADILUCE_THEME_KEY,
  LEGACY_STORAGE_KEYS,
} from '@/lib/storage-keys'
import { readWithMigration } from '@/lib/storage-migrate'

export type SiteTheme = 'light' | 'dark' | 'classic'

const THEME_LEGACY_KEYS = LEGACY_STORAGE_KEYS[IDEADILUCE_THEME_KEY]

const THEME_CYCLE: SiteTheme[] = ['classic', 'light', 'dark']

export const SITE_THEMES = THEME_CYCLE

const DEFAULT_THEME: SiteTheme = 'light'

function isSiteTheme(value: string | null): value is SiteTheme {
  return value === 'light' || value === 'dark' || value === 'classic'
}

function readStoredTheme(): SiteTheme | null {
  if (typeof window === 'undefined') return null
  const stored = readWithMigration(window.localStorage, IDEADILUCE_THEME_KEY, THEME_LEGACY_KEYS)
  return isSiteTheme(stored) ? stored : null
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
  isClassic: boolean
  setTheme: (theme: SiteTheme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function applyTheme(theme: SiteTheme) {
  if (theme === 'classic') {
    delete document.documentElement.dataset.theme
  } else {
    document.documentElement.dataset.theme = theme
  }
  document.documentElement.style.colorScheme = theme === 'dark' ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<SiteTheme>(DEFAULT_THEME)

  useEffect(() => {
    const resolved = resolveTheme()
    setThemeState(resolved)
    applyTheme(resolved)

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
      isClassic: theme === 'classic',
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
