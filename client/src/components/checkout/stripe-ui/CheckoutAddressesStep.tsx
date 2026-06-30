'use client'

import { useSnapshot } from 'valtio/react'
import {
  advanceCheckoutStep,
  applyResolvedAddress,
  canAdvanceFromStep,
  checkoutStore,
  hasCheckoutContactFromProfile,
  isBusinessCheckout,
  updateCheckoutAddress,
  updateClientOrderRef,
} from '@/features/checkout'
import { authStore } from '@/features/auth'
import { CheckoutAccountSection } from './CheckoutAccountSection'
import { CheckoutAddressSection } from './CheckoutAddressSection'
import { CheckoutBusinessFieldsSection } from './CheckoutBusinessFieldsSection'
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

export function CheckoutAddressesStep() {
  const { t } = useI18n()
  const checkout = useSnapshot(checkoutStore)
  const auth = useSnapshot(authStore)
  const business = isBusinessCheckout()
  const b = checkout.business
  const hideBusinessFields = business && checkout.anagraficaCollectedAtAccount
  const hideRetailFiscalCode =
    !business &&
    checkout.anagraficaCollectedAtAccount &&
    Boolean(b.fiscalCode.trim())
  const stepBusy =
    checkout.isLoading || checkout.initLoadingPhase != null || checkout.addressPrefillLoading

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
        showTitle={false}
        hideContactFields={hasCheckoutContactFromProfile()}
        address={checkout.draft.billing}
        onChange={(key, value) => updateCheckoutAddress('billing', key, value)}
        onAddressResolved={(resolved) =>
          void applyResolvedAddress('billing', resolved).catch(() => {})
        }
      />

      <CheckoutActionRow>
        <CheckoutStepBackButton disabled={stepBusy} />
        <StripePayButton
          className="min-w-0 flex-1"
          disabled={!canAdvanceFromStep('addresses') || stepBusy}
          onClick={() => void advanceCheckoutStep()}
        >
          {stepBusy ? t('checkout.processing') : t('checkout.continue')}
        </StripePayButton>
      </CheckoutActionRow>
    </section>
  )
}
