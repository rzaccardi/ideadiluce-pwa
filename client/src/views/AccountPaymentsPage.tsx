'use client'

import { useEffect, useState } from 'react'
import { useSnapshot } from 'valtio/react'
import { accountStore, clearAccountFeedback, saveProfile } from '@/features/account'
import { authStore } from '@/features/auth'
import { AccountSaveFeedback } from '@/components/account/AccountSaveFeedback'
import { PaymentMethodOption } from '@/components/checkout/PaymentMethodOption'
import { profilePaymentOptions, paymentMethodLabel } from '@/lib/paymentLabels'
import type { PwaPaymentMethodDTO } from '@/types/dto'
import { useI18n } from '@/hooks/use-i18n'
import { AccountDcPanel } from '@/components/account/dc/AccountDcPanel'
import { accountDcPrimaryBtnClass } from '@/components/account/dc/account-dc-styles'
import { FadeIn } from '@/components/motion'

export function AccountPaymentsPage() {
  const { locale, t } = useI18n()
  const auth = useSnapshot(authStore)
  const account = useSnapshot(accountStore)
  const [preferredPaymentMethod, setPreferredPaymentMethod] = useState<PwaPaymentMethodDTO>(
    auth.me?.preferredPaymentMethod ?? 'stripe',
  )

  useEffect(() => {
    if (!auth.me) return
    setPreferredPaymentMethod(auth.me.preferredPaymentMethod ?? 'stripe')
  }, [auth.me])

  if (!auth.me) return null

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    clearAccountFeedback()
    try {
      await saveProfile({ preferredPaymentMethod })
    } catch {
      /* errore in accountStore.error */
    }
  }

  const user = auth.me

  return (
    <FadeIn>
    <form onSubmit={(e) => void onSave(e)} className="space-y-[18px]">
      <AccountSaveFeedback />

      <AccountDcPanel
        title={t('account.payments.title')}
        description={t('account.profile.preferredPaymentHint')}
      >
        <p className="mb-4 text-sm text-idl-muted">
          {t('account.payments.current')}:{' '}
          <strong className="text-idl-graphite">
            {paymentMethodLabel(user.preferredPaymentMethod, locale)}
          </strong>
        </p>
        <div className="space-y-3">
          {profilePaymentOptions(locale).map((option) => (
            <PaymentMethodOption
              key={option.id}
              id={option.id}
              title={option.title}
              description={option.description}
              selected={preferredPaymentMethod === option.id}
              onSelect={() => setPreferredPaymentMethod(option.id)}
            />
          ))}
        </div>
        <button
          type="submit"
          disabled={account.isSaving}
          className={`mt-5 ${accountDcPrimaryBtnClass} disabled:opacity-60`}
        >
          {account.isSaving ? t('account.profile.saving') : t('account.profile.save')}
        </button>
      </AccountDcPanel>
    </form>
    </FadeIn>
  )
}
