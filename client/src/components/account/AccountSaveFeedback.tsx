'use client'

import { useSnapshot } from 'valtio/react'
import { accountStore } from '@/features/account'
import { ToastOnError, ToastOnSuccess, ToastOnWarning } from '@/components/ToastFeedback'
import { StripeErrorBanner } from '@/components/checkout/stripe-ui/StripeFields'
import { useI18n } from '@/hooks/use-i18n'

/** Toast + banner inline per salvataggio profilo account. */
export function AccountSaveFeedback() {
  const { t } = useI18n()
  const account = useSnapshot(accountStore)
  const warningMessage = account.odooSyncWarning ? t('account.profile.odooSyncWarning') : null

  return (
    <>
      <ToastOnError message={account.error} />
      <ToastOnSuccess message={account.message} />
      <ToastOnWarning message={warningMessage} />
      {account.odooSyncWarning ? (
        <div
          className="rounded-[14px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          role="status"
        >
          {t('account.profile.odooSyncWarning')}
        </div>
      ) : null}
      {account.error ? <StripeErrorBanner message={account.error} /> : null}
    </>
  )
}
