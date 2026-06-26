'use client'

import { ImpersonationBanner } from '@/components/ImpersonationBanner'
import { PageTransitionShell } from '@/components/motion'

export function FullscreenLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="checkout-root min-h-dvh overflow-x-hidden">
      <ImpersonationBanner />
      <PageTransitionShell>{children}</PageTransitionShell>
    </div>
  )
}
