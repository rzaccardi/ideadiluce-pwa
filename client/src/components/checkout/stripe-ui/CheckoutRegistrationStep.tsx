'use client'

import { useSnapshot } from 'valtio/react'
import { fetchCart } from '@/features/cart'
import {
  acceptGuestCheckout,
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
import {
  StripeControlledInput,
  StripeFieldGroup,
  StripePayButton,
} from '@/components/checkout/stripe-ui/StripeFields'

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
    checkoutStore.guestCheckoutAccepted = false
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

  const guestEmailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(checkout.draft.email.trim())

  return (
    <div className="space-y-6">
      <InlineAccountAuthStep
        email={checkout.draft.email}
        onEmailChange={updateCheckoutEmail}
        registerContinueLabel={t('checkout.account.createAndContinue')}
        onAuthSuccess={handleAuthSuccess}
        logoutScope="checkout"
        collectCustomerTypeOnRegister
      />

      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <div className="w-full border-t border-idl-tech-border" />
        </div>
        <p className="relative mx-auto w-fit bg-idl-tech-panel px-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#9298a3]">
          {t('checkout.account.orDivider')}
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-sm text-zinc-600">{t('checkout.account.guestHint')}</p>
        <StripeFieldGroup>
          <StripeControlledInput
            type="email"
            name="guest-email"
            placeholder={t('common.email')}
            autoComplete="email"
            value={checkout.draft.email}
            onValueChange={updateCheckoutEmail}
            required
          />
        </StripeFieldGroup>
        <StripePayButton className="w-full" disabled={!guestEmailOk} onClick={() => acceptGuestCheckout()}>
          {t('checkout.account.continueAsGuest')}
        </StripePayButton>
      </div>
    </div>
  )
}
