'use client'

import { LayoutGroup } from '@/lib/motion-client'
import { Link } from '@/lib/navigation'
import { useHeaderChromeCollapse } from '@/hooks/use-header-chrome-collapse'
import { useLocalePath } from '@/hooks/use-locale-path'
import type { DcActiveNavId } from '@/lib/dc-static-routes'
import type { SiteShellContent } from '@/types/site-content'
import { FALLBACK_SITE_SHELL } from '@/lib/site-shell-fallback'
import { layers } from '@/lib/layering'
import { cn } from '@/utils/cn'
import { BrandWordmark, SectionContainer } from './primitives'
import { SiteHeader } from './SiteHeader'
import { SiteFooter } from './SiteFooter'
import { TrustBar } from './TrustBar'
import { UtilityBar } from './UtilityBar'
import { LegacySiteNoticeBanner } from './LegacySiteNoticeBanner'

type Props = {
  shell: Readonly<SiteShellContent> | null
  activeNavId?: DcActiveNavId | null
  children: React.ReactNode
}

/** Slot che chiude in altezza lo chrome secondario (banner / utility) in scroll down. */
function ChromeCollapseSlot({
  collapsed,
  children,
}: {
  collapsed: boolean
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'grid transition-[grid-template-rows] duration-300 ease-out',
        collapsed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]',
      )}
      aria-hidden={collapsed || undefined}
    >
      <div className={cn('min-h-0 overflow-hidden', collapsed && 'pointer-events-none')}>{children}</div>
    </div>
  )
}

export function SiteShell({ shell, activeNavId = null, children }: Props) {
  const resolvedShell = shell ?? FALLBACK_SITE_SHELL
  const chromeCollapsed = useHeaderChromeCollapse()

  return (
    <LayoutGroup id="site-shell">
      <div className="site-shell flex min-h-screen min-w-0 flex-col bg-idl-paper font-sans text-idl-graphite">
        <div className={cn('site-chrome sticky top-0 isolate overflow-visible', layers.headerBar)}>
          <ChromeCollapseSlot collapsed={chromeCollapsed}>
            <LegacySiteNoticeBanner />
          </ChromeCollapseSlot>
          <ChromeCollapseSlot collapsed={chromeCollapsed}>
            <UtilityBar bar={resolvedShell.utilityBar} />
          </ChromeCollapseSlot>
          <SiteHeader
            nav={resolvedShell.nav}
            footer={resolvedShell.footer}
            activeNavId={activeNavId}
            chromeCollapsed={chromeCollapsed}
          />
        </div>
        <main className="site-page-canvas relative flex min-h-0 flex-1 flex-col overflow-x-clip">{children}</main>
        <TrustBar items={resolvedShell.trustBar} />
        <SiteFooter footer={resolvedShell.footer} />
      </div>
    </LayoutGroup>
  )
}

export function SiteShellMinimal({ children }: { children: React.ReactNode }) {
  const lp = useLocalePath()
  return (
    <div className="site-shell-minimal flex min-h-screen min-w-0 flex-col overflow-x-clip bg-idl-paper font-sans">
      <header className="border-b border-idl-border bg-idl-paper">
        <SectionContainer className="py-4">
          <Link to={lp('/')}>
            <BrandWordmark className="text-[24px] dark:brightness-0 dark:invert" />
          </Link>
        </SectionContainer>
      </header>
      <main className="site-page-canvas flex flex-1 flex-col">{children}</main>
    </div>
  )
}
