'use client'

import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useSnapshot } from 'valtio/react'
import type { SiteTheme } from '@/lib/appearance'
import { hydrateLightsStore, lightsStore, setLightsOn } from '@/features/lights'
import { themeFromLights } from '@/lib/appearance'

type ThemeContextValue = {
  theme: SiteTheme
  isDark: boolean
  setTheme: (theme: SiteTheme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { on: lightsOn } = useSnapshot(lightsStore)
  const [theme, setThemeState] = useState<SiteTheme>('light')

  useLayoutEffect(() => {
    hydrateLightsStore()
    setThemeState(themeFromLights(lightsStore.on))
  }, [])

  useEffect(() => {
    setThemeState(themeFromLights(lightsOn))
  }, [lightsOn])

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      isDark: theme === 'dark',
      setTheme: (next) => {
        setLightsOn(next === 'dark')
      },
      toggleTheme: () => {
        setLightsOn(!lightsStore.on)
      },
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

export type { SiteTheme }
