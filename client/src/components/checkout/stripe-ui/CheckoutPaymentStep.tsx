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
import { cn } from '@/utils/cn'
import { CheckoutActionRow, StripePayButton, StripeSectionTitle } from './StripeFields'
import { CheckoutStepBackButton } from './CheckoutStepBackButton'

type Props = {
  stripeCardDetails?: ReactNode
  stripeFormReady?: boolean
  stripeSessionReady?: boolean
  /** Pagina unica: niente continua verso review; CTA paga è in fondo pagina. */
  embedded?: boolean
  disabled?: boolean
}

export function CheckoutPaymentStep({
  stripeCardDetails,
  stripeFormReady = false,
  stripeSessionReady = false,
  embedded = false,
  disabled = false,
}: Props) {
  const { t } = useI18n()
  const checkout = useSnapshot(checkoutStore)
  const stripeSelected = checkout.selectedPaymentMethod === 'stripe'
  const optionsDisabled =
    disabled || checkout.isLoading || checkout.isPaying || checkout.cartRefreshing

  return (
    <section className={cn('space-y-5', disabled && 'pointer-events-none opacity-60')}>
      {embedded ? <StripeSectionTitle>{t('checkout.payment')}</StripeSectionTitle> : null}

      <CheckoutPaymentOptions
        selected={checkout.selectedPaymentMethod}
        disabled={optionsDisabled}
        stripeCardDetails={stripeCardDetails}
        onSelect={(method) => setPaymentMethod(method as import('@/features/checkout').CheckoutPaymentMethodDTO)}
      />

      {!embedded ? (
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
      ) : null}
    </section>
  )
}
