'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type SiteTheme = 'light' | 'dark'

const DEFAULT_THEME: SiteTheme = 'light'

function getSystemTheme(): SiteTheme {
  if (typeof window === 'undefined') return DEFAULT_THEME
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

type ThemeContextValue = {
  theme: SiteTheme
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function applyTheme(theme: SiteTheme) {
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme === 'dark' ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<SiteTheme>(DEFAULT_THEME)

  useEffect(() => {
    const applySystem = () => {
      const next = getSystemTheme()
      setThemeState(next)
      applyTheme(next)
    }

    applySystem()

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    media.addEventListener('change', applySystem)
    return () => media.removeEventListener('change', applySystem)
  }, [])

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === 'dark',
    }),
    [theme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme richiede ThemeProvider')
  return ctx
}
