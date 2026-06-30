'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from '@/lib/navigation'
import { useSnapshot } from 'valtio/react'
import { authStore } from '@/features/auth'
import { LoadingState } from '@/components/LoadingState'
import { useI18n } from '@/hooks/use-i18n'
import { localizePath, parseLocaleFromPathname } from '@/lib/locale'

/** Reindirizza utenti già autenticati (es. login/registrazione → dashboard). */
export function RedirectIfAuthenticated({ children }: { children: React.ReactNode }) {
  const { t } = useI18n()
  const auth = useSnapshot(authStore)
  const pathname = usePathname()
  const router = useRouter()
  const locale = parseLocaleFromPathname(pathname)
  const accountPath = localizePath('/account', locale)

  useEffect(() => {
    if (!auth.isLoading && !auth.isHydrating && auth.isAuthenticated) {
      router.replace(accountPath)
    }
  }, [auth.isLoading, auth.isHydrating, auth.isAuthenticated, accountPath, router])

  if (auth.isHydrating) {
    return <LoadingState message={t('auth.preparingAccount')} />
  }

  if (auth.isLoading && !auth.me && auth.error == null) {
    return <LoadingState message={t('auth.sessionChecking')} />
  }

  if (auth.isAuthenticated) {
    return <LoadingState message={t('auth.redirectingToAccount')} />
  }

  return <>{children}</>
}
