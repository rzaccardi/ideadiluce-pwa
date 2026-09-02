'use client'

import { Suspense, useEffect } from 'react'
import { LocaleProvider } from '@/context/locale-context'
import { ThemeProvider } from '@/context/theme-context'
import { bootstrapSession } from '@/app/bootstrap'
import { attachSessionRefreshListener } from '@/features/auth'
import { cleanupLegacyServiceWorkers } from '@/lib/legacy-sw-cleanup'
import { initValtioDevtools } from '@/lib/valtio-devtools'
import { AppToaster } from '@/components/ui/AppToaster'
import { CookiebotRouteSync } from '@/components/CookiebotRouteSync'
import { WhatsAppFloatingButton } from '@/components/site/WhatsAppFloatingButton'
import type { PwaLocale } from '@/lib/locale'
import type { LocaleMessages } from '@/i18n/messages'

function BootstrapGate({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    attachSessionRefreshListener()
  }, [])

  useEffect(() => {
    void bootstrapSession({
      pathname: typeof window !== 'undefined' ? window.location.pathname : undefined,
    })
    // Solo al mount: pathname evita doppio GET carrello su landing diretta in /cart.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <>{children}</>
}

export function Providers({
  children,
  initialLocale,
  initialMessages,
}: {
  children: React.ReactNode
  initialLocale?: PwaLocale
  initialMessages?: LocaleMessages
}) {
  useEffect(() => {
    void cleanupLegacyServiceWorkers()
  }, [])

  useEffect(() => initValtioDevtools(), [])

  return (
    <Suspense fallback={null}>
      <ThemeProvider>
        <LocaleProvider initialLocale={initialLocale} initialMessages={initialMessages}>
          <BootstrapGate>
            {children}
            <CookiebotRouteSync />
            <WhatsAppFloatingButton />
          </BootstrapGate>
        </LocaleProvider>
      </ThemeProvider>
      <AppToaster />
    </Suspense>
  )
}
