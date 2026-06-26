import type { ReactNode } from 'react'
import { PageFlexBody, PageFlexShell } from '@/components/layout/PageFlexShell'

/** Layout full-bleed carrello: hero + area grigia che riempie lo spazio sotto. */
export function CartPageShell({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <PageFlexShell tone="tech-panel" className={className}>
      {children}
    </PageFlexShell>
  )
}

export function CartPageBody({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <PageFlexBody tone="tech-panel" className={className}>
      {children}
    </PageFlexBody>
  )
}
