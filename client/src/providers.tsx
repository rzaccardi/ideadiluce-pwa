'use client'

import { Suspense, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { LocaleProvider } from '@/context/locale-context'
import { ThemeProvider } from '@/context/theme-context'
import { bootstrapSession } from '@/app/bootstrap'
import { attachSessionRefreshListener } from '@/features/auth'
import { parseLocaleFromPathname } from '@/lib/locale'
import { cleanupLegacyServiceWorkers } from '@/lib/legacy-sw-cleanup'
import { initValtioDevtools } from '@/lib/valtio-devtools'
import { AppToaster } from '@/components/ui/AppToaster'
import { WhatsAppFloatingButton } from '@/components/site/WhatsAppFloatingButton'

function BootstrapGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  useEffect(() => {
    attachSessionRefreshListener()
  }, [])

  useEffect(() => {
    void bootstrapSession({ pathname })
    // Solo al mount: pathname evita doppio GET carrello su landing diretta in /cart.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <>{children}</>
}

function LocaleProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const locale = parseLocaleFromPathname(pathname)

  return (
    <LocaleProvider initialLocale={locale}>
      <BootstrapGate>
        {children}
        <WhatsAppFloatingButton />
      </BootstrapGate>
    </LocaleProvider>
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void cleanupLegacyServiceWorkers()
  }, [])

  useEffect(() => initValtioDevtools(), [])

  return (
    <Suspense fallback={null}>
      <ThemeProvider>
        <LocaleProviders>{children}</LocaleProviders>
      </ThemeProvider>
      <AppToaster />
    </Suspense>
  )
}
