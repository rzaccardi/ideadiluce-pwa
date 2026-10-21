'use client'

import { useSnapshot } from 'valtio/react'
import {
  advanceCheckoutStep,
  canAdvanceFromStep,
  checkoutStore,
  freeShippingSelectionLocked,
  isRomePickupEligible,
  selectShippingMethod,
} from '@/features/checkout'
import { cartStore } from '@/features/cart/cart.store'
import { resolveCartMaxLeadTimeDays } from '@/lib/product-availability'
import { CheckoutShippingOptions } from './CheckoutShippingOptions'
import { CheckoutInfoNote } from './CheckoutStepPrimitives'
import { useI18n } from '@/hooks/use-i18n'
import { CheckoutActionRow, StripePayButton } from './StripeFields'
import { CheckoutStepBackButton } from './CheckoutStepBackButton'

export function CheckoutShippingMethodStep() {
  const { t, tParams } = useI18n()
  const checkout = useSnapshot(checkoutStore)
  const cart = useSnapshot(cartStore)
  const deliveryEstimateDays =
    resolveCartMaxLeadTimeDays(cart.cart?.items ?? []) ?? checkout.deliveryEstimateDays

  return (
    <section className="space-y-5">
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

      {freeShippingSelectionLocked() ? (
        <CheckoutInfoNote tone="success">
          {t('checkout.shipping.freeShippingLockedHint')}
        </CheckoutInfoNote>
      ) : null}

      {deliveryEstimateDays != null ? (
        <CheckoutInfoNote>
          {tParams('checkout.shipping.deliveryEstimate', { days: deliveryEstimateDays })}
        </CheckoutInfoNote>
      ) : null}

      {!isRomePickupEligible(checkout.draft.shipping) &&
      checkout.draft.shipping.country.toUpperCase() === 'IT' &&
      checkout.shippingQuotes.length > 0 ? (
        <p className="text-sm text-idl-muted">{t('checkout.shipping.pickupRomeOnly')}</p>
      ) : null}

      <CheckoutActionRow>
        <CheckoutStepBackButton />
        <StripePayButton
          className="min-w-0 flex-1"
          disabled={
            !canAdvanceFromStep('shipping_method') ||
            checkout.isLoading ||
            checkout.shippingQuotesLoading
          }
          loading={checkout.isLoading || checkout.shippingQuotesLoading}
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
