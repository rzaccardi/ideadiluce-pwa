'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from '@/lib/navigation'
import { useSnapshot } from 'valtio/react'
import { authStore } from '@/features/auth'
import { AuthLoadingOverlay } from '@/components/site/auth/AuthLoadingOverlay'
import { AuthPageSkeleton } from '@/components/site/skeletons'
import { localizePath, parseLocaleFromPathname } from '@/lib/locale'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const auth = useSnapshot(authStore)
  const pathname = usePathname()
  const router = useRouter()
  const locale = parseLocaleFromPathname(pathname)

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      const loginPath = localizePath('/login', locale)
      router.replace(`${loginPath}?from=${encodeURIComponent(pathname)}`)
    }
  }, [auth.isLoading, auth.isAuthenticated, locale, pathname, router])

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

  if (!auth.isAuthenticated) {
    return (
      <>
        <AuthPageSkeleton fieldCount={2} />
        <AuthLoadingOverlay icon="bulb" messageKey="auth.redirectingToLogin" />
      </>
    )
  }

  return <>{children}</>
}
