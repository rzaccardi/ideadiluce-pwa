'use client'

import { useSnapshot } from 'valtio/react'
import {
  advanceCheckoutStep,
  canAdvanceFromStep,
  checkoutStore,
  goBackCheckoutStep,
  setDeliveryRecipientMode,
  updateDeliveryRecipientField,
  updateDropshipAddress,
} from '@/features/checkout'
import { CheckoutAddressSection } from './CheckoutAddressSection'
import { CheckoutPanel, CheckoutSegmentControl, CheckoutStepHeader } from './CheckoutStepPrimitives'
import { useI18n } from '@/hooks/use-i18n'
import {
  CheckoutActionRow,
  StripeBackButton,
  StripeFieldGroup,
  StripeControlledInput,
  StripePayButton,
} from './StripeFields'

export function CheckoutDeliveryRecipientStep() {
  const { t } = useI18n()
  const checkout = useSnapshot(checkoutStore)
  const recipient = checkout.deliveryRecipient

  return (
    <section className="space-y-5">
      <CheckoutStepHeader
        title={t('checkout.steps.deliveryRecipient')}
        subtitle={t('checkout.deliveryRecipient.hint')}
      />

      <CheckoutSegmentControl<'self' | 'other'>
        value={recipient.mode ?? 'self'}
        options={(['self', 'other'] as const).map((mode) => ({
          value: mode,
          label: t(`checkout.deliveryRecipient.${mode}.title`),
        }))}
        onChange={(mode) => setDeliveryRecipientMode(mode)}
      />

      {recipient.mode === 'other' ? (
        <CheckoutPanel className="space-y-4 bg-[#f7f8fa]">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <StripeFieldGroup>
              <StripeControlledInput
                name="recipient-firstName"
                placeholder={t('checkout.register.firstName')}
                value={recipient.firstName}
                onValueChange={(value) => updateDeliveryRecipientField('firstName', value)}
              />
            </StripeFieldGroup>
            <StripeFieldGroup>
              <StripeControlledInput
                name="recipient-lastName"
                placeholder={t('checkout.register.lastName')}
                value={recipient.lastName}
                onValueChange={(value) => updateDeliveryRecipientField('lastName', value)}
              />
            </StripeFieldGroup>
          </div>
          <StripeFieldGroup>
            <StripeControlledInput
              name="recipient-company"
              placeholder={t('checkout.deliveryRecipient.company')}
              value={recipient.company}
              onValueChange={(value) => updateDeliveryRecipientField('company', value)}
            />
          </StripeFieldGroup>
          <StripeFieldGroup>
            <StripeControlledInput
              type="tel"
              name="recipient-phone"
              placeholder={t('checkout.address.phoneOptional')}
              value={recipient.phone}
              onValueChange={(value) => updateDeliveryRecipientField('phone', value)}
            />
          </StripeFieldGroup>
          <CheckoutAddressSection
            title={t('checkout.deliveryRecipient.addressTitle')}
            prefix="dropship"
            showTitle={false}
            address={checkout.dropshipAddress}
            onChange={(key, value) => updateDropshipAddress(key, value)}
            onAddressResolved={(resolved) => {
              updateDropshipAddress('line1', resolved.line1)
              updateDropshipAddress('line2', resolved.line2 ?? '')
              updateDropshipAddress('city', resolved.city)
              updateDropshipAddress('postalCode', resolved.postalCode)
              updateDropshipAddress('country', resolved.country)
            }}
          />
          <p className="text-xs text-[#6c727c]">{t('checkout.deliveryRecipient.notSavedHint')}</p>
        </CheckoutPanel>
      ) : null}

      <CheckoutActionRow>
        <StripeBackButton onClick={goBackCheckoutStep} />
        <StripePayButton
          className="min-w-0 flex-1"
          disabled={!canAdvanceFromStep('delivery_recipient') || checkout.isLoading}
          loading={checkout.isLoading}
          onClick={() => void advanceCheckoutStep()}
        >
          {t('checkout.continueToPayment')}
        </StripePayButton>
      </CheckoutActionRow>
    </section>
  )
}
