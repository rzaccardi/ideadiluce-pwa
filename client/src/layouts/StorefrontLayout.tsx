'use client'

import { useEffect, useLayoutEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useSnapshot } from 'valtio/react'
import { ImpersonationBanner } from '@/components/ImpersonationBanner'
import { CartFeedbackLayer } from '@/components/cart/CartFeedbackLayer'
import { SiteShell } from '@/components/site/SiteShell'
import { GlobalSearchProvider } from '@/context/global-search-context'
import { fetchSitePage, hydrateSitePageContent, siteStore } from '@/features/site'
import { useLocale } from '@/context/locale-context'
import { resolveDcActiveNavId } from '@/lib/dc-static-routes'
import { FALLBACK_SITE_SHELL } from '@/lib/site-shell-fallback'
import type { SiteShellContent } from '@/types/site-content'

type Props = {
  children: React.ReactNode
  initialShell?: SiteShellContent | null
}

export function StorefrontLayout({ children, initialShell = null }: Props) {
  const { locale } = useLocale()
  const pathname = usePathname()
  const { pages } = useSnapshot(siteStore)
  const storedShellLocale = siteStore.pageLocales.shell
  // Non riusare shell di un'altra lingua: evita UI "mezzo IT" dopo switchLocale.
  const shell = (
    storedShellLocale === locale && pages.shell
      ? pages.shell
      : initialShell
        ? initialShell
        : FALLBACK_SITE_SHELL
  ) as SiteShellContent
  const activeNavId = resolveDcActiveNavId(pathname)

  useLayoutEffect(() => {
    if (initialShell) {
      hydrateSitePageContent('shell', locale, initialShell)
    }
  }, [initialShell, locale])

  useEffect(() => {
    void fetchSitePage('shell', locale, {
      skipIfFresh: storedShellLocale === locale,
    })
  }, [locale, storedShellLocale])

  return (
    <GlobalSearchProvider>
      <CartFeedbackLayer />
      <ImpersonationBanner />
      <SiteShell shell={shell} activeNavId={activeNavId}>
        {children}
      </SiteShell>
    </GlobalSearchProvider>
  )
}
