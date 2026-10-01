'use client'

import { ImpersonationBanner } from '@/components/ImpersonationBanner'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

export function FullscreenLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="checkout-root min-h-dvh overflow-x-hidden">
      <ImpersonationBanner />
      <div className="pointer-events-none fixed right-3 top-3 z-40 sm:right-5 sm:top-4">
        <div className="pointer-events-auto">
          <LanguageSwitcher variant="header" />
        </div>
      </div>
      {children}
    </div>
  )
}
