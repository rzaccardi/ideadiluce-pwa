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

  // Non smontare i children su isLoading: login/register impostano isLoading e
  // unmount cancellerebbe email/password dopo un errore di credenziali.
  // Il controllo sessione iniziale e il loading del form restano gestiti dalla pagina.
  if (auth.isHydrating || auth.isAuthenticated) {
    return (
      <>
        <AuthPageSkeleton fieldCount={2} />
        <AuthLoadingOverlay
          icon="bulb"
          messageKey={auth.isHydrating ? 'auth.preparingAccount' : 'auth.redirectingToAccount'}
        />
      </>
    )
  }

  return <>{children}</>
}
