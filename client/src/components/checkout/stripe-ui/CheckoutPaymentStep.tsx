'use client'

import { useSnapshot } from 'valtio/react'
import {
  advanceCheckoutStep,
  canAdvanceFromStep,
  checkoutStore,
  goBackCheckoutStep,
  prepareCheckoutPayment,
  setPaymentMethod,
} from '@/features/checkout'
import { CheckoutPaymentOptions } from './CheckoutPaymentOptions'
import { CheckoutStepHeader } from './CheckoutStepPrimitives'
import { useI18n } from '@/hooks/use-i18n'
import { CheckoutActionRow, StripeBackButton, StripePayButton } from './StripeFields'

export function CheckoutPaymentStep() {
  const { t } = useI18n()
  const checkout = useSnapshot(checkoutStore)

  return (
    <section className="space-y-5">
      <CheckoutStepHeader title={t('checkout.payment')} subtitle={t('checkout.paymentNote')} />

      <CheckoutPaymentOptions
        selected={checkout.selectedPaymentMethod}
        disabled={checkout.isLoading || checkout.isPaying}
        onSelect={(method) => setPaymentMethod(method as import('@/features/checkout').CheckoutPaymentMethodDTO)}
      />

      <CheckoutActionRow>
        <StripeBackButton onClick={goBackCheckoutStep} />
        <StripePayButton
          className="min-w-0 flex-1"
          disabled={!canAdvanceFromStep('payment') || checkout.isLoading}
          loading={checkout.isLoading}
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
