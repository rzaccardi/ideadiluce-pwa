'use client'

import { useCallback, useState } from 'react'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import type { ClearClientSessionScope } from '@/features/auth'
import { useI18n } from '@/hooks/use-i18n'
import { useLocalePath } from '@/hooks/use-locale-path'
import { useLogout } from '@/hooks/use-logout'

type UseLogoutConfirmOptions = {
  scope?: ClearClientSessionScope
  /** Default: home; `false` resta sulla pagina corrente (checkout). */
  redirectTo?: string | false
}

export function useLogoutConfirm(options?: UseLogoutConfirmOptions) {
  const { t } = useI18n()
  const lp = useLocalePath()
  const performLogout = useLogout()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)

  const isCheckoutScope = options?.scope === 'checkout'

  const requestLogout = useCallback(() => {
    setOpen(true)
  }, [])

  const closeLogout = useCallback(() => {
    if (!pending) setOpen(false)
  }, [pending])

  async function confirmLogout() {
    setPending(true)
    try {
      const redirectTo =
        options?.redirectTo ?? (isCheckoutScope ? false : lp('/'))

      await performLogout({
        scope: options?.scope,
        redirectTo,
        toast: true,
      })
      setOpen(false)
    } finally {
      setPending(false)
    }
  }

  const logoutDialog = (
    <ConfirmDialog
      open={open}
      title={t('account.shell.logoutConfirmTitle')}
      description={
        isCheckoutScope
          ? t('checkout.account.logoutConfirmDescription')
          : t('account.shell.logoutConfirmDescription')
      }
      confirmLabel={t('account.shell.logoutShort')}
      cancelLabel={t('common.cancel')}
      confirmPending={pending}
      onCancel={closeLogout}
      onConfirm={() => void confirmLogout()}
    />
  )

  return { requestLogout, logoutDialog, logoutPending: pending }
}
