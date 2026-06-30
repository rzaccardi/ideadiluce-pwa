'use client'

import { SiteFooter } from '@/components/site/SiteFooter'
import { SiteHeader } from '@/components/site/SiteHeader'
import { TrustBar } from '@/components/site/TrustBar'
import { UtilityBar } from '@/components/site/UtilityBar'
import type { DcActiveNavId } from '@/lib/dc-static-routes'
import type { SiteShellContent } from '@/types/site-content'

type Props = {
  shell: SiteShellContent
  activeNavId?: DcActiveNavId | null
  children: React.ReactNode
}

/** Header + footer dinamici (CMS) per pagine con body HTML statico DC. */
export function DcStaticShell({ shell, activeNavId = null, children }: Props) {
  return (
    <div className="flex min-h-screen flex-col bg-idl-paper font-sans text-idl-graphite">
      <UtilityBar bar={shell.utilityBar} />
      <SiteHeader nav={shell.nav} footer={shell.footer} activeNavId={activeNavId} />
      <main className="flex-1">{children}</main>
      <TrustBar items={shell.trustBar} />
      <SiteFooter footer={shell.footer} />
    </div>
  )
}
