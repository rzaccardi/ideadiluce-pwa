'use client'

import { useEffect } from 'react'
import { useSnapshot } from 'valtio/react'
import {
  advanceCheckoutStep,
  applyResolvedAddress,
  canAdvanceFromStep,
  canFetchShippingQuotes,
  checkoutStore,
  freeShippingSelectionLocked,
  hasCheckoutContactFromProfile,
  initShippingFromBilling,
  isBusinessCheckout,
  isBusinessAnagraficaComplete,
  isRomePickupEligible,
  selectShippingMethod,
  setBillingSameAsShipping,
  setDeliveryRecipientMode,
  updateCheckoutAddress,
  updateClientOrderRef,
  updateDeliveryRecipientField,
  updateDropshipAddress,
} from '@/features/checkout'
import { authStore } from '@/features/auth'
import { isCheckoutAddressValid } from '@/lib/checkout-address.validators'
import { CheckoutAccountSection } from './CheckoutAccountSection'
import { CheckoutAddressSection } from './CheckoutAddressSection'
import { CheckoutBusinessFieldsSection } from './CheckoutBusinessFieldsSection'
import { CheckoutRetailFiscalCodeField } from './CheckoutRetailFiscalCodeField'
import { CourierNotesField } from './CheckoutAddressFields'
import { CheckoutShippingOptions } from './CheckoutShippingOptions'
import {
  CheckoutInfoNote,
  CheckoutPanel,
  CheckoutSegmentControl,
  CheckoutToggleCheckbox,
} from './CheckoutStepPrimitives'
import { useI18n } from '@/hooks/use-i18n'
import {
  CheckoutActionRow,
  StripeControlledInput,
  StripeFieldGroup,
  StripeFieldLabel,
  StripePayButton,
  StripeSectionTitle,
} from './StripeFields'
import { CheckoutStepBackButton } from './CheckoutStepBackButton'

export function CheckoutAddressesStep() {
  const { t, tParams } = useI18n()
  const checkout = useSnapshot(checkoutStore)
  const auth = useSnapshot(authStore)
  const business = isBusinessCheckout()
  const hideBusinessFields = business && checkout.anagraficaCollectedAtAccount
  const hideRetailFiscalCode = !business && auth.isAuthenticated
  const stepBusy =
    checkout.isLoading ||
    checkout.initLoadingPhase != null ||
    checkout.addressPrefillLoading
  const recipient = checkout.deliveryRecipient
  const deliveryMode = recipient.mode ?? 'self'
  const shipToDifferentAddress = !checkout.draft.billingSameAsShipping
  const useBillingForShipping = !shipToDifferentAddress && deliveryMode === 'self'
  const billingComplete =
    isCheckoutAddressValid(checkout.draft.billing) &&
    (!business || isBusinessAnagraficaComplete())
  const shippingSectionReady = billingComplete && canFetchShippingQuotes()
  const continueBusy =
    stepBusy ||
    checkout.shippingQuotesLoading ||
    Boolean(checkout.shippingSelectingRef)

  useEffect(() => {
    if (checkoutStore.deliveryRecipient.mode == null) {
      setDeliveryRecipientMode('self')
    }
    initShippingFromBilling()
  }, [])

  return (
    <section className="space-y-5">
      {auth.me ? <CheckoutAccountSection /> : null}

      {auth.me?.isProfessional ? (
        <CheckoutInfoNote>{t('checkout.billing.professionalActive')}</CheckoutInfoNote>
      ) : null}

      {!hideBusinessFields ? (
        <CheckoutBusinessFieldsSection showClientOrderRef={business} disabled={stepBusy} />
      ) : business ? (
        <div>
          <StripeFieldLabel htmlFor="clientOrderRef">{t('checkout.billing.clientOrderRefOptional')}</StripeFieldLabel>
          <StripeFieldGroup>
            <StripeControlledInput
              id="clientOrderRef"
              name="clientOrderRef"
              placeholder={t('checkout.billing.clientOrderRefOptional')}
              value={checkout.clientOrderRef}
              onValueChange={(value) => updateClientOrderRef(value)}
            />
          </StripeFieldGroup>
        </div>
      ) : null}

      {!business && !hideRetailFiscalCode ? <CheckoutRetailFiscalCodeField disabled={stepBusy} /> : null}

      <CheckoutAddressSection
        title={t('checkout.billingAddress')}
        prefix="bill"
        showTitle
        hideContactFields={hasCheckoutContactFromProfile()}
        address={checkout.draft.billing}
        onChange={(key, value) => updateCheckoutAddress('billing', key, value)}
        onAddressResolved={(resolved) =>
          void applyResolvedAddress('billing', resolved).catch(() => {})
        }
      />

      <div className="space-y-4 border-t border-idl-tech-border pt-5">
        <StripeSectionTitle>{t('checkout.shippingAddress')}</StripeSectionTitle>

        {business ? (
          <CheckoutSegmentControl<'self' | 'other'>
            value={deliveryMode}
            options={(['self', 'other'] as const).map((m) => ({
              value: m,
              label: t(`checkout.deliveryRecipient.${m}.title`),
            }))}
            onChange={(m) => setDeliveryRecipientMode(m)}
          />
        ) : null}

        {deliveryMode === 'self' ? (
          <>
            <CheckoutToggleCheckbox
              checked={checkout.draft.billingSameAsShipping}
              disabled={stepBusy}
              onChange={(checked) => setBillingSameAsShipping(checked)}
              label={t('checkout.shipping.diffFromBilling')}
            />
            {useBillingForShipping ? (
              <CheckoutInfoNote>{t('checkout.shipping.sameAsBillingHint')}</CheckoutInfoNote>
            ) : null}
          </>
        ) : null}

        {useBillingForShipping ? (
          <div>
            <StripeFieldLabel htmlFor="ship-courier-notes">{t('checkout.address.courierNotes')}</StripeFieldLabel>
            <StripeFieldGroup>
              <CourierNotesField
                id="ship-courier-notes"
                name="ship-courier-notes"
                placeholder={t('checkout.address.courierNotes')}
                value={checkout.draft.shipping.courierNotes ?? ''}
                onValueChange={(value) => updateCheckoutAddress('shipping', 'courierNotes', value)}
              />
            </StripeFieldGroup>
          </div>
        ) : null}

        {deliveryMode === 'self' && shipToDifferentAddress ? (
          <CheckoutAddressSection
            title={t('checkout.shippingAddress')}
            prefix="ship"
            showTitle={false}
            address={checkout.draft.shipping}
            showCourierNotes
            hideContactFields={hasCheckoutContactFromProfile()}
            onChange={(key, value) => updateCheckoutAddress('shipping', key, value)}
            onAddressResolved={(resolved) =>
              void applyResolvedAddress('shipping', resolved).catch(() => {})
            }
          />
        ) : null}

        {business && deliveryMode === 'other' ? (
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
      </div>

      <div className="space-y-4 border-t border-idl-tech-border pt-5">
        <StripeSectionTitle>{t('checkout.shipping.title')}</StripeSectionTitle>

        <CheckoutShippingOptions
          quotes={checkout.shippingQuotes}
          selectedRef={checkout.selectedShippingMethodRef}
          selectingRef={checkout.shippingSelectingRef}
          loading={checkout.shippingQuotesLoading}
          blocked={!shippingSectionReady}
          selectionLocked={freeShippingSelectionLocked()}
          onSelect={(ref) => {
            void selectShippingMethod(ref).catch(() => {})
          }}
        />

        {shippingSectionReady ? (
          <>
            {freeShippingSelectionLocked() ? (
              <CheckoutInfoNote>{t('checkout.shipping.freeShippingLockedHint')}</CheckoutInfoNote>
            ) : null}

            {checkout.deliveryEstimateDays != null ? (
              <CheckoutInfoNote>
                {tParams('checkout.shipping.deliveryEstimate', { days: checkout.deliveryEstimateDays })}
              </CheckoutInfoNote>
            ) : null}

            {!isRomePickupEligible(checkout.draft.shipping) &&
            checkout.draft.shipping.country.toUpperCase() === 'IT' &&
            checkout.shippingQuotes.length > 0 ? (
              <p className="text-sm text-idl-muted">{t('checkout.shipping.pickupRomeOnly')}</p>
            ) : null}
          </>
        ) : null}
      </div>

      <CheckoutActionRow>
        <CheckoutStepBackButton disabled={continueBusy} />
        <StripePayButton
          className="min-w-0 flex-1"
          disabled={!canAdvanceFromStep('addresses') || continueBusy}
          loading={continueBusy}
          onClick={() => void advanceCheckoutStep()}
        >
          {continueBusy ? t('checkout.processing') : t('checkout.continueToPayment')}
        </StripePayButton>
      </CheckoutActionRow>
    </section>
  )
}
