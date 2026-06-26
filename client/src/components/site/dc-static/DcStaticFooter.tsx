'use client'

import { useSnapshot } from 'valtio/react'
import { SiteFooter } from '@/components/site/SiteFooter'
import { TrustBar } from '@/components/site/TrustBar'
import { siteStore } from '@/features/site'
import type { SiteShellContent } from '@/types/site-content'

export function DcStaticFooter() {
  const { pages } = useSnapshot(siteStore)
  const shell = pages.shell as SiteShellContent | undefined

  if (!shell) {
    return (
      <>
        <div className="h-20 animate-pulse border-t border-idl-border bg-idl-cream" aria-hidden />
        <div className="h-64 animate-pulse bg-idl-design" aria-hidden />
      </>
    )
  }

  return (
    <>
      <TrustBar items={shell.trustBar} />
      <SiteFooter footer={shell.footer} />
    </>
  )
}
