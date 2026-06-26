'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useSnapshot } from 'valtio/react'
import { ImpersonationBanner } from '@/components/ImpersonationBanner'
import { CartFeedbackLayer } from '@/components/cart/CartFeedbackLayer'
import { PageTransitionShell } from '@/components/motion'
import { SiteShell } from '@/components/site/SiteShell'
import { fetchSitePage, siteStore } from '@/features/site'
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
  const shell = (pages.shell ?? initialShell) as SiteShellContent | null
  const activeNavId = resolveDcActiveNavId(pathname)

  useEffect(() => {
    if (initialShell && !siteStore.pages.shell) {
      siteStore.pages.shell = initialShell
    }
  }, [initialShell])

  useEffect(() => {
    void fetchSitePage('shell', locale)
  }, [locale])

  return (
    <>
      <CartFeedbackLayer />
      <ImpersonationBanner />
      <SiteShell shell={shell as SiteShellContent | null} activeNavId={activeNavId}>
        <PageTransitionShell>{children}</PageTransitionShell>
      </SiteShell>
    </>
  )
}
