'use client'

import { ImpersonationBanner } from '@/components/ImpersonationBanner'

export function FullscreenLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="checkout-root min-h-dvh overflow-x-hidden">
      <ImpersonationBanner />
      {children}
    </div>
  )
}
