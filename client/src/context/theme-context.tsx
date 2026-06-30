'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

export type SiteTheme = 'light' | 'dark' | 'classic'

const STORAGE_KEY = 'idl-theme'

const THEME_CYCLE: SiteTheme[] = ['classic', 'light', 'dark']

export const SITE_THEMES = THEME_CYCLE

const DEFAULT_THEME: SiteTheme = 'dark'

function isSiteTheme(value: string | null): value is SiteTheme {
  return value === 'light' || value === 'dark' || value === 'classic'
}

function readStoredTheme(): SiteTheme | null {
  if (typeof window === 'undefined') return null
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return isSiteTheme(stored) ? stored : null
}

function getSystemTheme(): SiteTheme {
  if (typeof window === 'undefined') return DEFAULT_THEME
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'classic'
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
    window.localStorage.setItem(STORAGE_KEY, next)
    applyTheme(next)
    setThemeState(next)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const next = getNextTheme(current)
      window.localStorage.setItem(STORAGE_KEY, next)
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
