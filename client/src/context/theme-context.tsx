'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

export type SiteTheme = 'light' | 'dark'

const STORAGE_KEY = 'idl-theme'

type ThemeContextValue = {
  theme: SiteTheme
  isDark: boolean
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readStoredTheme(): SiteTheme {
  if (typeof window === 'undefined') return 'light'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === 'dark' ? 'dark' : 'light'
}

function applyTheme(theme: SiteTheme) {
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<SiteTheme>('light')

  useEffect(() => {
    const stored = readStoredTheme()
    setTheme(stored)
    applyTheme(stored)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next: SiteTheme = current === 'dark' ? 'light' : 'dark'
      window.localStorage.setItem(STORAGE_KEY, next)
      applyTheme(next)
      return next
    })
  }, [])

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === 'dark',
      toggleTheme,
    }),
    [theme, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme richiede ThemeProvider')
  return ctx
}
