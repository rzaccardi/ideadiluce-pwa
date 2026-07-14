'use client'

import { useSnapshot } from 'valtio/react'
import {
  advanceCheckoutStep,
  applyResolvedAddress,
  canAdvanceFromStep,
  checkoutStore,
  setBillingSameAsShipping,
  updateCheckoutAddress,
} from '@/features/checkout'
import { CheckoutAddressSection } from './CheckoutAddressSection'
import { CheckoutToggleCheckbox } from './CheckoutStepPrimitives'
import { useI18n } from '@/hooks/use-i18n'
import { CheckoutActionRow, StripePayButton } from './StripeFields'
import { CheckoutStepBackButton } from './CheckoutStepBackButton'

export function CheckoutShippingStep() {
  const { t } = useI18n()
  const checkout = useSnapshot(checkoutStore)
  const form = checkout.draft

  return (
    <section className="space-y-5">
      <CheckoutAddressSection
        title={t('checkout.shippingAddress')}
        prefix="ship"
        showTitle={false}
        address={form.shipping}
        showCourierNotes
        onChange={(key, value) => updateCheckoutAddress('shipping', key, value)}
        onAddressResolved={(resolved) =>
          void applyResolvedAddress('shipping', resolved).catch(() => {})
        }
      />

      <CheckoutToggleCheckbox
        checked={form.billingSameAsShipping}
        onChange={(checked) => setBillingSameAsShipping(checked)}
        label={t('checkout.shipping.diffFromBilling')}
        className="mt-2"
      />

      <CheckoutActionRow>
        <CheckoutStepBackButton />
        <StripePayButton
          className="min-w-0 flex-1"
          disabled={!canAdvanceFromStep('shipping') || checkout.isLoading}
          onClick={() => void advanceCheckoutStep()}
        >
          {checkout.isLoading ? t('checkout.processing') : t('checkout.continue')}
        </StripePayButton>
      </CheckoutActionRow>
    </section>
  )
}
