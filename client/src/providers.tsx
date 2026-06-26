'use client'

import { Suspense, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { LocaleProvider } from '@/context/locale-context'
import { ThemeProvider } from '@/context/theme-context'
import { appStore } from '@/features/app'
import { bootstrapSession } from '@/app/bootstrap'
import { attachSessionRefreshListener } from '@/features/auth'
import { parseLocaleFromPathname } from '@/lib/locale'
import { isDcStaticPath } from '@/lib/dc-static-routes'
import { cleanupLegacyServiceWorkers } from '@/lib/legacy-sw-cleanup'
import { useSnapshot } from 'valtio/react'
import { AppBootstrapScreen } from '@/app/AppBootstrapScreen'
import { AppToaster } from '@/components/ui/AppToaster'

function BootstrapGate({ children }: { children: React.ReactNode }) {
  const app = useSnapshot(appStore)
  const pathname = usePathname()
  const isStaticDcPage = isDcStaticPath(pathname)

  useEffect(() => {
    attachSessionRefreshListener()
  }, [])

  useEffect(() => {
    if (!app.isBootstrapped) void bootstrapSession()
  }, [app.isBootstrapped])

  if (!app.isBootstrapped && !isStaticDcPage) {
    return <AppBootstrapScreen pathname={pathname} />
  }

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
