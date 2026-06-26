'use client'

import { useSnapshot } from 'valtio/react'
import {
  advanceCheckoutStep,
  canAdvanceFromStep,
  checkoutStore,
  setCustomerSegment,
} from '@/features/checkout'
import { CheckoutCustomerTypeCards } from './CheckoutCustomerTypeCards'
import { useI18n } from '@/hooks/use-i18n'
import { CheckoutActionRow, StripePayButton } from './StripeFields'
import { CheckoutStepBackButton } from './CheckoutStepBackButton'

export function CheckoutCustomerTypeStep() {
  const { t } = useI18n()
  const checkout = useSnapshot(checkoutStore)

  return (
    <section className="space-y-5">
      <CheckoutCustomerTypeCards
        value={checkout.customerSegment ?? 'retail'}
        onChange={setCustomerSegment}
      />

      <CheckoutActionRow>
        <CheckoutStepBackButton />
        <StripePayButton
          className="min-w-0 flex-1"
          disabled={!canAdvanceFromStep('customer_type')}
          onClick={() => void advanceCheckoutStep()}
        >
          {t('checkout.continue')}
        </StripePayButton>
      </CheckoutActionRow>
    </section>
  )
}
