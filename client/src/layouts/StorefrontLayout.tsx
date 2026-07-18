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
import type { SiteShellContent } from '@/types/site-content'

type Props = {
  children: React.ReactNode
  initialShell?: SiteShellContent | null
}

export function StorefrontLayout({ children, initialShell = null }: Props) {
  const { locale } = useLocale()
  const pathname = usePathname()
  const { pages } = useSnapshot(siteStore)
  const shell =
    (siteStore.pageLocales.shell === locale ? pages.shell : initialShell) as SiteShellContent | null
  const activeNavId = resolveDcActiveNavId(pathname)

  useLayoutEffect(() => {
    if (initialShell) {
      hydrateSitePageContent('shell', locale, initialShell)
    }
  }, [initialShell, locale])

  useEffect(() => {
    void fetchSitePage('shell', locale, { skipIfFresh: true })
  }, [locale])

  return (
    <GlobalSearchProvider>
      <CartFeedbackLayer />
      <ImpersonationBanner />
      <SiteShell shell={shell as SiteShellContent | null} activeNavId={activeNavId}>
        {children}
      </SiteShell>
    </GlobalSearchProvider>
  )
}
