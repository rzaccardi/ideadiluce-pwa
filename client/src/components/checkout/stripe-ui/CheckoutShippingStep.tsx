'use client'

import { useSnapshot } from 'valtio/react'
import {
  advanceCheckoutStep,
  applyResolvedAddress,
  canAdvanceFromStep,
  checkoutStore,
  goBackCheckoutStep,
  setBillingSameAsShipping,
  updateCheckoutAddress,
} from '@/features/checkout'
import { CheckoutAddressSection } from './CheckoutAddressSection'
import { CheckoutStepHeader, CheckoutToggleCheckbox } from './CheckoutStepPrimitives'
import { useI18n } from '@/hooks/use-i18n'
import { CheckoutActionRow, StripeBackButton, StripePayButton } from './StripeFields'

export function CheckoutShippingStep() {
  const { t } = useI18n()
  const checkout = useSnapshot(checkoutStore)
  const form = checkout.draft
  const billingDiffers = !form.billingSameAsShipping

  return (
    <section className="space-y-5">
      <CheckoutStepHeader
        title={t('checkout.shippingAddress')}
        subtitle={
          billingDiffers
            ? t('checkout.shipping.diffAddressSubtitle')
            : t('checkout.shipping.addressSubtitle')
        }
      />

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
        checked={billingDiffers}
        onChange={(checked) => setBillingSameAsShipping(!checked)}
        label={t('checkout.shipping.diffFromBilling')}
        className="mt-2"
      />

      <CheckoutActionRow>
        <StripeBackButton onClick={goBackCheckoutStep} />
        <StripePayButton
          className="min-w-0 flex-1"
          disabled={!canAdvanceFromStep('shipping') || checkout.isLoading}
          loading={checkout.isLoading}
          onClick={() => void advanceCheckoutStep()}
        >
          {t('checkout.continue')}
        </StripePayButton>
      </CheckoutActionRow>
    </section>
  )
}
