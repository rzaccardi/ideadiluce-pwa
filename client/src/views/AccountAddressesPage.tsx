'use client'

import { useEffect, useState } from 'react'
import { useSnapshot } from 'valtio/react'
import { accountStore, clearAccountFeedback, saveProfile } from '@/features/account'
import { authStore } from '@/features/auth'
import { AccountSaveFeedback } from '@/components/account/AccountSaveFeedback'
import { CheckoutAddressSection } from '@/components/checkout/stripe-ui/CheckoutAddressSection'
import {
  addressInputToDto,
  emptyAddress,
  isAddressComplete,
  shippingAddressFromUser,
} from '@/lib/address'
import type { AddressInput } from '@/types/integrations'
import { useI18n } from '@/hooks/use-i18n'
import { AccountDcPanel } from '@/components/account/dc/AccountDcPanel'
import { accountDcPrimaryBtnClass } from '@/components/account/dc/account-dc-styles'
import { FadeIn } from '@/components/motion'
import { formatAddressSummary } from '@/lib/address'

export function AccountAddressesPage() {
  const { t } = useI18n()
  const auth = useSnapshot(authStore)
  const account = useSnapshot(accountStore)
  const [shippingAddress, setShippingAddress] = useState<AddressInput>(emptyAddress)

  useEffect(() => {
    if (!auth.me) return
    setShippingAddress(shippingAddressFromUser(auth.me))
  }, [auth.me])

  if (!auth.me) return null

  function updateShippingAddress<K extends keyof AddressInput>(key: K, value: AddressInput[K]) {
    setShippingAddress((current) => ({ ...current, [key]: value }))
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    clearAccountFeedback()

    const hasAddressDraft = Boolean(
      shippingAddress.line1.trim() ||
        shippingAddress.city.trim() ||
        shippingAddress.postalCode.trim(),
    )

    if (hasAddressDraft && !isAddressComplete(shippingAddress)) {
      accountStore.error = t('account.profile.validationError')
      return
    }

    try {
      await saveProfile({
        shippingAddress: hasAddressDraft ? addressInputToDto(shippingAddress) : null,
      })
    } catch {
      /* errore in accountStore.error */
    }
  }

  const summary = formatAddressSummary(auth.me.shippingAddress)

  return (
    <FadeIn>
    <form onSubmit={(e) => void onSave(e)} className="space-y-[18px]">
      <AccountSaveFeedback />

      {summary && summary !== '—' ? (
        <AccountDcPanel title={t('account.addresses.current')}>
          <p className="text-[13.5px] leading-relaxed text-[#5b616b] whitespace-pre-line">{summary}</p>
        </AccountDcPanel>
      ) : null}

      <AccountDcPanel title={t('account.nav.addresses')}>
        <CheckoutAddressSection
          title={t('account.profile.shippingAddress')}
          prefix="account-shipping"
          address={shippingAddress}
          onChange={updateShippingAddress}
        />
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
