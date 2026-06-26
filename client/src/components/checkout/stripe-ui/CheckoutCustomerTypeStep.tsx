'use client'

import { useSnapshot } from 'valtio/react'
import {
  advanceCheckoutStep,
  canAdvanceFromStep,
  checkoutStore,
  goBackCheckoutStep,
  setCustomerSegment,
} from '@/features/checkout'
import { CheckoutSegmentControl, CheckoutStepHeader } from './CheckoutStepPrimitives'
import { useI18n } from '@/hooks/use-i18n'
import { CheckoutActionRow, StripeBackButton, StripePayButton } from './StripeFields'

export function CheckoutCustomerTypeStep() {
  const { t } = useI18n()
  const checkout = useSnapshot(checkoutStore)

  return (
    <section className="space-y-5">
      <CheckoutStepHeader
        title={t('checkout.steps.customerType')}
        subtitle={t('checkout.customerType.hint')}
      />

      <CheckoutSegmentControl<'retail' | 'business'>
        value={checkout.customerSegment ?? 'retail'}
        options={(['retail', 'business'] as const).map((value) => ({
          value,
          label: t(`checkout.customerType.${value}.title`),
        }))}
        onChange={setCustomerSegment}
      />

      <CheckoutActionRow>
        <StripeBackButton onClick={goBackCheckoutStep} />
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
