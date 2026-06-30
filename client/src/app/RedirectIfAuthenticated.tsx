'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from '@/lib/navigation'
import { useSnapshot } from 'valtio/react'
import { authStore } from '@/features/auth'
import { AuthLoadingOverlay } from '@/components/site/auth/AuthLoadingOverlay'
import { AuthPageSkeleton } from '@/components/site/skeletons'
import { localizePath, parseLocaleFromPathname } from '@/lib/locale'

/** Reindirizza utenti già autenticati (es. login/registrazione → dashboard). */
export function RedirectIfAuthenticated({ children }: { children: React.ReactNode }) {
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
    return (
      <>
        <AuthPageSkeleton fieldCount={2} />
        <AuthLoadingOverlay icon="bulb" messageKey="auth.preparingAccount" />
      </>
    )
  }

  if (auth.isLoading && !auth.me && auth.error == null) {
    return (
      <>
        <AuthPageSkeleton fieldCount={2} />
        <AuthLoadingOverlay icon="shield" messageKey="auth.sessionChecking" />
      </>
    )
  }

  if (auth.isAuthenticated) {
    return (
      <>
        <AuthPageSkeleton fieldCount={2} />
        <AuthLoadingOverlay icon="bulb" messageKey="auth.redirectingToAccount" />
      </>
    )
  }

  return <>{children}</>
}
