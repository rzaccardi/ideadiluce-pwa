'use client'

import { useSnapshot } from 'valtio/react'
import {
  advanceCheckoutStep,
  canAdvanceFromStep,
  checkoutStore,
  freeShippingSelectionLocked,
  goBackCheckoutStep,
  isRomePickupEligible,
  selectShippingMethod,
} from '@/features/checkout'
import { CheckoutShippingOptions } from './CheckoutShippingOptions'
import { CheckoutInfoNote, CheckoutStepHeader } from './CheckoutStepPrimitives'
import { useI18n } from '@/hooks/use-i18n'
import { CheckoutActionRow, StripeBackButton, StripePayButton } from './StripeFields'

export function CheckoutShippingMethodStep() {
  const { t, tParams } = useI18n()
  const checkout = useSnapshot(checkoutStore)

  return (
    <section className="space-y-5">
      <CheckoutStepHeader
        title={t('checkout.shipping.title')}
        subtitle={t('checkout.shipping.methodSubtitle')}
      />

      <CheckoutShippingOptions
        quotes={checkout.shippingQuotes}
        selectedRef={checkout.selectedShippingMethodRef}
        selectingRef={checkout.shippingSelectingRef}
        loading={checkout.shippingQuotesLoading}
        blocked={false}
        selectionLocked={freeShippingSelectionLocked()}
        onSelect={(ref) => {
          void selectShippingMethod(ref).catch(() => {})
        }}
      />

      {checkout.deliveryEstimateDays != null ? (
        <CheckoutInfoNote>
          {tParams('checkout.shipping.deliveryEstimate', { days: checkout.deliveryEstimateDays })}
        </CheckoutInfoNote>
      ) : null}

      {!isRomePickupEligible(checkout.draft.shipping) &&
      checkout.draft.shipping.country.toUpperCase() === 'IT' &&
      checkout.shippingQuotes.length > 0 ? (
        <p className="text-sm text-[#6c727c]">{t('checkout.shipping.pickupRomeOnly')}</p>
      ) : null}

      <CheckoutActionRow>
        <StripeBackButton onClick={goBackCheckoutStep} />
        <StripePayButton
          className="min-w-0 flex-1"
          disabled={
            !canAdvanceFromStep('shipping_method') ||
            checkout.isLoading ||
            checkout.shippingQuotesLoading
          }
          onClick={() => void advanceCheckoutStep()}
        >
          {checkout.isLoading || checkout.shippingQuotesLoading
            ? t('checkout.processing')
            : t('checkout.continueToPayment')}
        </StripePayButton>
      </CheckoutActionRow>
    </section>
  )
}
