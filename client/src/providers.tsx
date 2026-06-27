'use client'

import { Suspense, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { LocaleProvider } from '@/context/locale-context'
import { ThemeProvider } from '@/context/theme-context'
import { bootstrapSession } from '@/app/bootstrap'
import { attachSessionRefreshListener } from '@/features/auth'
import { parseLocaleFromPathname } from '@/lib/locale'
import { cleanupLegacyServiceWorkers } from '@/lib/legacy-sw-cleanup'
import { AppToaster } from '@/components/ui/AppToaster'

function BootstrapGate({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    attachSessionRefreshListener()
  }, [])

  useEffect(() => {
    void bootstrapSession()
  }, [])

  return <>{children}</>
}

function LocaleProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const locale = parseLocaleFromPathname(pathname)

  return (
    <LocaleProvider initialLocale={locale}>
      <BootstrapGate>{children}</BootstrapGate>
    </LocaleProvider>
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void cleanupLegacyServiceWorkers()
  }, [])

  return (
    <Suspense fallback={null}>
      <ThemeProvider>
        <LocaleProviders>{children}</LocaleProviders>
      </ThemeProvider>
      <AppToaster />
    </Suspense>
  )
}
