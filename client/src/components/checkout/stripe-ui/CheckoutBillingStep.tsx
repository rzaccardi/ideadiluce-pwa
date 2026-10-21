'use client'

import { useSnapshot } from 'valtio/react'
import {
  advanceCheckoutStep,
  applyResolvedAddress,
  canAdvanceFromStep,
  checkoutStore,
  hasCheckoutContactFromProfile,
  isBusinessCheckout,
  isCheckoutCustomerSegmentVisible,
  setCustomerSegment,
  updateCheckoutAddress,
  updateClientOrderRef,
} from '@/features/checkout'
import { authStore } from '@/features/auth'
import { PhonePrefixField } from '@/components/PhonePrefixField'
import { CheckoutAccountSection } from './CheckoutAccountSection'
import { CheckoutAddressSection } from './CheckoutAddressSection'
import { CheckoutBusinessFieldsSection } from './CheckoutBusinessFieldsSection'
import { CheckoutCustomerTypeCards } from './CheckoutCustomerTypeCards'
import { CheckoutRetailFiscalCodeField } from './CheckoutRetailFiscalCodeField'
import { CheckoutInfoNote } from './CheckoutStepPrimitives'
import { useI18n } from '@/hooks/use-i18n'
import {
  CheckoutActionRow,
  StripeControlledInput,
  StripeFieldGroup,
  StripeFieldLabel,
  StripePayButton,
} from './StripeFields'
import { CheckoutStepBackButton } from './CheckoutStepBackButton'

export function CheckoutBillingStep() {
  const { t } = useI18n()
  const checkout = useSnapshot(checkoutStore)
  const auth = useSnapshot(authStore)
  const business = isBusinessCheckout()
  const showCustomerSegment = isCheckoutCustomerSegmentVisible()
  const hideBusinessFields = business && checkout.anagraficaCollectedAtAccount
  const needsLogin =
    !auth.isAuthenticated &&
    (checkout.contactForceLogin || checkout.emailLookup.exists === true)
  const hideRetailFiscalCode = !business && (auth.isAuthenticated || needsLogin)
  const hideBillingPerson = hasCheckoutContactFromProfile()
  const hideBillingPhone = hideBillingPerson
  const stepBusy =
    checkout.isLoading || checkout.initLoadingPhase != null || checkout.addressPrefillLoading

  return (
    <section className="space-y-5">
      {auth.me ? <CheckoutAccountSection /> : null}

      {auth.me?.isProfessional ? (
        <CheckoutInfoNote>{t('checkout.billing.professionalActive')}</CheckoutInfoNote>
      ) : null}

      {showCustomerSegment ? (
        <CheckoutCustomerTypeCards
          variant="tabs"
          value={checkout.customerSegment ?? 'retail'}
          onChange={setCustomerSegment}
        />
      ) : null}

      {!hideBillingPerson ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <StripeFieldLabel htmlFor="bill-firstName">{t('common.firstName')}</StripeFieldLabel>
            <StripeFieldGroup>
              <StripeControlledInput
                id="bill-firstName"
                name="bill-firstName"
                placeholder={t('common.firstName')}
                autoComplete="given-name"
                value={checkout.draft.billing.firstName}
                readOnly={stepBusy}
                onValueChange={(value) => updateCheckoutAddress('billing', 'firstName', value)}
              />
            </StripeFieldGroup>
          </div>
          <div>
            <StripeFieldLabel htmlFor="bill-lastName">{t('common.lastName')}</StripeFieldLabel>
            <StripeFieldGroup>
              <StripeControlledInput
                id="bill-lastName"
                name="bill-lastName"
                placeholder={t('common.lastName')}
                autoComplete="family-name"
                value={checkout.draft.billing.lastName}
                readOnly={stepBusy}
                onValueChange={(value) => updateCheckoutAddress('billing', 'lastName', value)}
              />
            </StripeFieldGroup>
          </div>
        </div>
      ) : null}

      {!business && !hideRetailFiscalCode ? <CheckoutRetailFiscalCodeField disabled={stepBusy} /> : null}

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

      <CheckoutAddressSection
        title={t('checkout.billingAddress')}
        prefix="bill"
        showTitle={false}
        hideContactFields
        address={checkout.draft.billing}
        onChange={(key, value) => updateCheckoutAddress('billing', key, value)}
        onAddressResolved={(resolved) =>
          void applyResolvedAddress('billing', resolved).catch(() => {})
        }
      />

      {!hideBillingPhone ? (
        <div>
          <StripeFieldLabel htmlFor="bill-phone">{t('common.phone')}</StripeFieldLabel>
          <StripeFieldGroup>
            <PhonePrefixField
              id="bill-phone"
              name="bill-phone"
              value={checkout.draft.billing.phone ?? ''}
              defaultCountry={checkout.draft.billing.country}
              required
              disabled={stepBusy}
              onValueChange={(value) => updateCheckoutAddress('billing', 'phone', value)}
            />
          </StripeFieldGroup>
        </div>
      ) : null}

      <CheckoutActionRow>
        <CheckoutStepBackButton disabled={stepBusy} />
        <StripePayButton
          className="min-w-0 flex-1"
          disabled={!canAdvanceFromStep('billing') || stepBusy}
          onClick={() => void advanceCheckoutStep()}
        >
          {stepBusy ? t('checkout.processing') : t('checkout.continueToShipping')}
        </StripePayButton>
      </CheckoutActionRow>
    </section>
  )
}
