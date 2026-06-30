'use client'

import { useEffect } from 'react'
import { useSnapshot } from 'valtio/react'
import {
  advanceCheckoutStep,
  applyResolvedAddress,
  canAdvanceFromStep,
  checkoutStore,
  isBusinessCheckout,
  setDeliveryRecipientMode,
  updateCheckoutAddress,
  updateDeliveryRecipientField,
  updateDropshipAddress,
} from '@/features/checkout'
import { CheckoutAddressSection } from './CheckoutAddressSection'
import { CheckoutPanel, CheckoutSegmentControl } from './CheckoutStepPrimitives'
import { useI18n } from '@/hooks/use-i18n'
import {
  CheckoutActionRow,
  StripeControlledInput,
  StripeFieldGroup,
  StripePayButton,
} from './StripeFields'
import { CheckoutStepBackButton } from './CheckoutStepBackButton'

export function CheckoutDeliveryRecipientStep() {
  const { t } = useI18n()
  const checkout = useSnapshot(checkoutStore)
  const recipient = checkout.deliveryRecipient
  const mode = recipient.mode ?? 'self'
  const business = isBusinessCheckout()
  const stepBusy =
    checkout.isLoading || checkout.initLoadingPhase != null || checkout.addressPrefillLoading

  useEffect(() => {
    if (checkoutStore.deliveryRecipient.mode == null) {
      setDeliveryRecipientMode('self')
    }
  }, [])

  return (
    <section className="space-y-5">
      <CheckoutSegmentControl<'self' | 'other'>
        value={mode}
        options={
          business
            ? (['self', 'other'] as const).map((m) => ({
                value: m,
                label: t(`checkout.deliveryRecipient.${m}.title`),
              }))
            : [{ value: 'self' as const, label: t('checkout.deliveryRecipient.self.title') }]
        }
        onChange={(m) => setDeliveryRecipientMode(m)}
      />

      {mode === 'self' ? (
        <CheckoutAddressSection
          title={t('checkout.shippingAddress')}
          prefix="ship"
          showTitle={false}
          address={checkout.draft.shipping}
          showCourierNotes
          onChange={(key, value) => updateCheckoutAddress('shipping', key, value)}
          onAddressResolved={(resolved) =>
            void applyResolvedAddress('shipping', resolved).catch(() => {})
          }
        />
      ) : null}

      {mode === 'other' ? (
        <CheckoutPanel className="space-y-4 bg-idl-tech-panel">
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
          <p className="text-xs text-idl-muted">{t('checkout.deliveryRecipient.notSavedHint')}</p>
        </CheckoutPanel>
      ) : null}

      <CheckoutActionRow>
        <CheckoutStepBackButton disabled={stepBusy} />
        <StripePayButton
          className="min-w-0 flex-1"
          disabled={!canAdvanceFromStep('delivery_recipient') || stepBusy}
          loading={checkout.isLoading}
          onClick={() => void advanceCheckoutStep()}
        >
          {stepBusy ? t('checkout.processing') : t('checkout.continue')}
        </StripePayButton>
      </CheckoutActionRow>
    </section>
  )
}
