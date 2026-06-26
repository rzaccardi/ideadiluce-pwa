'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from '@/lib/navigation'
import { useSnapshot } from 'valtio/react'
import { authStore } from '@/features/auth'
import { LoadingState } from '@/components/LoadingState'
import { useI18n } from '@/hooks/use-i18n'
import { localizePath, parseLocaleFromPathname } from '@/lib/locale'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { t } = useI18n()
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

  if (auth.isLoading && !auth.me && auth.error == null) {
    return <LoadingState message={t('auth.sessionChecking')} />
  }

  if (!auth.isAuthenticated) {
    return <LoadingState message={t('auth.redirectingToLogin')} />
  }

  return <>{children}</>
}
