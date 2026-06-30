'use client'

import { useSnapshot } from 'valtio/react'
import { SiteHeader } from '@/components/site/SiteHeader'
import { siteStore } from '@/features/site'
import type { DcActiveNavId } from '@/lib/dc-static-routes'
import type { SiteShellContent } from '@/types/site-content'

type Props = {
  activeNavId?: DcActiveNavId | null
}

export function DcStaticHeader({ activeNavId = null }: Props) {
  const { pages } = useSnapshot(siteStore)
  const shell = pages.shell as SiteShellContent | undefined

  if (!shell) {
    return <div className="h-[72px] animate-pulse border-b border-idl-border bg-idl-paper" aria-hidden />
  }

  return <SiteHeader nav={shell.nav} footer={shell.footer} activeNavId={activeNavId} />
}
