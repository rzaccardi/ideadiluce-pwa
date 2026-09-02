'use client'

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { hydrateLocale, isLocaleLoaded, preloadLocale } from '@/i18n/messages'
import type { LocaleMessages } from '@/i18n/messages'
import {
  HTML_LANG,
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
  initialMessages?: LocaleMessages
}

function applyDocumentLocale(locale: PwaLocale) {
  if (typeof document === 'undefined') return
  document.documentElement.lang = HTML_LANG[locale]
}

export function LocaleProvider({ children, initialLocale, initialMessages }: LocaleProviderProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()

  if (initialLocale && initialMessages) {
    hydrateLocale(initialLocale, initialMessages)
  }

  const [locale, setLocale] = useState<PwaLocale>(
    () => initialLocale ?? parseLocaleFromPathname(pathname),
  )

  useLayoutEffect(() => {
    const next = parseLocaleFromPathname(window.location.pathname)
    setLocale(next)
    applyDocumentLocale(next)
  }, [pathname])

  useEffect(() => {
    if (isLocaleLoaded(locale)) return
    void preloadLocale(locale)
  }, [locale])

  const pathWithoutLocale = stripLocalePrefix(pathname)

  const localize = useCallback((path: string) => localizePath(path, locale), [locale])

  const switchLocale = useCallback(
    (next: PwaLocale) => {
      const search = searchParams.toString()
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : pathname
      const unprefixed = stripLocalePrefix(currentPath)
      const target = localizePath(`${unprefixed}${search ? `?${search}` : ''}`, next)
      applyDocumentLocale(next)
      void preloadLocale(next).then(() => {
        setLocale(next)
        router.push(target)
      })
    },
    [router, pathname, searchParams],
  )

  const value = useMemo(
    () => ({ locale, pathWithoutLocale, localize, switchLocale }),
    [locale, pathWithoutLocale, localize, switchLocale],
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale richiede LocaleProvider')
  return ctx
}
