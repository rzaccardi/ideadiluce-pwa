'use client'

import type { ReactNode } from 'react'
import { useSnapshot } from 'valtio/react'
import {
  advanceCheckoutStep,
  canAdvanceFromStep,
  checkoutStore,
  prepareCheckoutPayment,
  setPaymentMethod,
} from '@/features/checkout'
import { CheckoutPaymentOptions } from './CheckoutPaymentOptions'
import { useI18n } from '@/hooks/use-i18n'
import { CheckoutActionRow, StripePayButton } from './StripeFields'
import { CheckoutStepBackButton } from './CheckoutStepBackButton'

type Props = {
  stripeCardDetails?: ReactNode
  stripeFormReady?: boolean
  stripeSessionReady?: boolean
}

export function CheckoutPaymentStep({
  stripeCardDetails,
  stripeFormReady = false,
  stripeSessionReady = false,
}: Props) {
  const { t } = useI18n()
  const checkout = useSnapshot(checkoutStore)
  const stripeSelected = checkout.selectedPaymentMethod === 'stripe'

  return (
    <section className="space-y-5">
      <CheckoutPaymentOptions
        selected={checkout.selectedPaymentMethod}
        disabled={checkout.isLoading || checkout.isPaying || checkout.cartRefreshing}
        stripeCardDetails={stripeCardDetails}
        onSelect={(method) => setPaymentMethod(method as import('@/features/checkout').CheckoutPaymentMethodDTO)}
      />

      <CheckoutActionRow>
        <CheckoutStepBackButton />
        <StripePayButton
          className="min-w-0 flex-1"
          disabled={!canAdvanceFromStep('payment') || checkout.isLoading || checkout.cartRefreshing}
          loading={checkout.isLoading || checkout.cartRefreshing}
          onClick={() => {
            void (async () => {
              if (stripeSelected && !stripeSessionReady) {
                checkoutStore.error = t('checkout.payment.formNotReady')
                return
              }
              if (stripeSelected && !stripeFormReady) {
                checkoutStore.error = t('checkout.payment.cardIncomplete')
                return
              }
              try {
                await prepareCheckoutPayment({ silent: true })
                checkoutStore.error = null
                advanceCheckoutStep()
              } catch {
                /* errore in store */
              }
            })()
          }}
        >
          {t('checkout.continue')}
        </StripePayButton>
      </CheckoutActionRow>
    </section>
  )
}
