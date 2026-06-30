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
}

export function CheckoutPaymentStep({ stripeCardDetails }: Props) {
  const { t } = useI18n()
  const checkout = useSnapshot(checkoutStore)

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
          disabled={
            !canAdvanceFromStep('payment') || checkout.isLoading || checkout.cartRefreshing
          }
          loading={checkout.isLoading || checkout.cartRefreshing}
          onClick={() => {
            void (async () => {
              try {
                await prepareCheckoutPayment({ silent: true })
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
