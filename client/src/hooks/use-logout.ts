'use client'

import { useCallback } from 'react'
import { useRouter } from '@/lib/navigation'
import { logout, type LogoutOptions } from '@/features/auth'
import { useI18n } from '@/hooks/use-i18n'
import { useLocalePath } from '@/hooks/use-locale-path'
import { notify } from '@/lib/notify'

export type UseLogoutOptions = LogoutOptions & {
  /** Percorso post-logout; default home (`/`). `false` per non navigare. */
  redirectTo?: string | false
  toast?: boolean
}

export function useLogout() {
  const router = useRouter()
  const lp = useLocalePath()
  const { t } = useI18n()

  return useCallback(
    async (options?: UseLogoutOptions) => {
      const { redirectTo, toast = true, scope } = options ?? {}
      const result = await logout({ scope })

      if (toast) {
        if (result.remoteOk) {
          notify.success(t('auth.loggedOut'))
        } else {
          notify.warning(t('auth.loggedOutLocalOnly'))
        }
      }

      if (redirectTo !== false) {
        router.replace(redirectTo ?? lp('/'))
      }

      return result
    },
    [lp, router, t],
  )
}
