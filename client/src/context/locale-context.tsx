'use client'

import { createContext, useCallback, useContext, useEffect, useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { preloadLocale } from '@/i18n/messages'
import {
  localizePath,
  parseLocaleFromPathname,
  stripLocalePrefix,
  type PwaLocale,
} from '@/lib/locale'

type LocaleContextValue = {
  locale: PwaLocale
  pathWithoutLocale: string
  localize: (path: string) => string
  switchLocale: (next: PwaLocale) => void
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

type LocaleProviderProps = {
  children: React.ReactNode
  initialLocale?: PwaLocale
}

export function LocaleProvider({ children, initialLocale }: LocaleProviderProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()

  const locale = useMemo(() => {
    if (initialLocale) return initialLocale
    return parseLocaleFromPathname(pathname)
  }, [initialLocale, pathname])

  const pathWithoutLocale = stripLocalePrefix(pathname)

  const localize = useCallback((path: string) => localizePath(path, locale), [locale])

  const switchLocale = useCallback(
    (next: PwaLocale) => {
      const search = searchParams.toString()
      const target = localizePath(`${pathWithoutLocale}${search ? `?${search}` : ''}`, next)
      router.push(target)
    },
    [router, pathWithoutLocale, searchParams],
  )

  const value = useMemo(
    () => ({ locale, pathWithoutLocale, localize, switchLocale }),
    [locale, pathWithoutLocale, localize, switchLocale],
  )

  useEffect(() => {
    void preloadLocale(locale)
  }, [locale])

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale richiede LocaleProvider')
  return ctx
}
