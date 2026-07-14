'use client'

import { useSnapshot } from 'valtio/react'
import { fetchCart } from '@/features/cart'
import {
  checkoutStore,
  initShippingFromBilling,
  markAnagraficaCollectedAtAccount,
  prepareCheckoutAfterAuth,
  setCustomerSegment,
  updateCheckoutAddress,
  updateCheckoutEmail,
} from '@/features/checkout'
import { useI18n } from '@/hooks/use-i18n'
import { InlineAccountAuthStep } from '@/components/auth/InlineAccountAuthStep'

export function CheckoutRegistrationStep() {
  const { t } = useI18n()
  const checkout = useSnapshot(checkoutStore)

  async function handleAuthSuccess(info: {
    mode: 'register' | 'login'
    email: string
    firstName?: string
    lastName?: string
    phone?: string
    customerSegment?: 'retail' | 'business' | null
  }) {
    updateCheckoutEmail(info.email)
    if (info.mode === 'register') {
      if (info.customerSegment) setCustomerSegment(info.customerSegment)
      markAnagraficaCollectedAtAccount()
      if (info.firstName) updateCheckoutAddress('shipping', 'firstName', info.firstName)
      if (info.lastName) updateCheckoutAddress('shipping', 'lastName', info.lastName)
      if (info.phone) updateCheckoutAddress('shipping', 'phone', info.phone)
      if (info.firstName) updateCheckoutAddress('billing', 'firstName', info.firstName)
      if (info.lastName) updateCheckoutAddress('billing', 'lastName', info.lastName)
      if (info.phone) updateCheckoutAddress('billing', 'phone', info.phone)
      initShippingFromBilling()
    }
    await fetchCart({ force: true, reprice: true })
    await prepareCheckoutAfterAuth()
  }

  return (
    <InlineAccountAuthStep
      email={checkout.draft.email}
      onEmailChange={updateCheckoutEmail}
      registerContinueLabel={t('checkout.account.createAndContinue')}
      onAuthSuccess={handleAuthSuccess}
      logoutScope="checkout"
      collectCustomerTypeOnRegister
    />
  )
}
