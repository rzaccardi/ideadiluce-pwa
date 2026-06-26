'use client'

import { useState } from 'react'
import { useSnapshot } from 'valtio/react'
import {
  advanceCheckoutStep,
  applyResolvedAddress,
  canAdvanceFromStep,
  checkoutStore,
  goBackCheckoutStep,
  isBusinessCheckout,
  updateBusinessField,
  updateCheckoutAddress,
  updateClientOrderRef,
  validateTaxFields,
} from '@/features/checkout'
import { authStore } from '@/features/auth'
import { CheckoutAccountSection } from './CheckoutAccountSection'
import { CheckoutAddressSection } from './CheckoutAddressSection'
import { CheckoutBusinessFieldsSection } from './CheckoutBusinessFieldsSection'
import {
  CheckoutInfoNote,
  CheckoutStepHeader,
} from './CheckoutStepPrimitives'
import { useI18n } from '@/hooks/use-i18n'
import {
  CheckoutActionRow,
  StripeBackButton,
  StripeControlledInput,
  StripeFieldGroup,
  StripeFieldLabel,
  StripePayButton,
} from './StripeFields'

function TaxValidationMessage({
  valid,
  validLabel,
  invalidLabel,
}: {
  valid: boolean | null
  validLabel: string
  invalidLabel: string
}) {
  if (valid == null) return null
  return (
    <p className={`px-1 text-xs ${valid ? 'text-emerald-700' : 'text-red-700'}`}>
      {valid ? validLabel : invalidLabel}
    </p>
  )
}

export function CheckoutBillingStep() {
  const { t } = useI18n()
  const checkout = useSnapshot(checkoutStore)
  const auth = useSnapshot(authStore)
  const business = isBusinessCheckout()
  const b = checkout.business
  const hideBusinessFields = business && checkout.anagraficaCollectedAtAccount
  const [showFiscalCode, setShowFiscalCode] = useState(Boolean(b.fiscalCode.trim()))
  const stepBusy = checkout.isLoading || b.taxValidating || checkout.addressPrefillLoading

  async function handleTaxBlur() {
    if (checkout.business.taxValidating) return
    try {
      await validateTaxFields()
    } catch {
      /* errore in store */
    }
  }

  return (
    <section className="space-y-5">
      <CheckoutStepHeader
        title={t('checkout.billingAddress')}
        subtitle={t('checkout.billing.subtitle')}
      />

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

      {!business && (showFiscalCode ? (
        <div>
          <StripeFieldLabel htmlFor="fiscalCode">{t('checkout.billing.fiscalCodeOptional')}</StripeFieldLabel>
          <StripeFieldGroup>
            <StripeControlledInput
              id="fiscalCode"
              name="fiscalCode"
              placeholder="RSSMRA80A01H501U"
              value={checkout.business.fiscalCode}
              normalize={(v) => v.toUpperCase()}
              onValueChange={(value) => updateBusinessField('fiscalCode', value)}
              onBlur={() => void handleTaxBlur()}
            />
          </StripeFieldGroup>
          <TaxValidationMessage
            valid={b.fiscalCode.trim() ? b.fiscalCodeValid : null}
            validLabel={t('checkout.billing.fiscalCodeValid')}
            invalidLabel={t('checkout.billing.fiscalCodeInvalid')}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowFiscalCode(true)}
          className="text-sm font-medium text-[#9a6a2f] underline decoration-[#cdbfa5] underline-offset-2 hover:decoration-[#9a6a2f]"
        >
          {t('checkout.billing.fiscalCodeOptional')}
        </button>
      ))}

      <CheckoutAddressSection
        title={t('checkout.billingAddress')}
        prefix="bill"
        showTitle={false}
        address={checkout.draft.billing}
        onChange={(key, value) => updateCheckoutAddress('billing', key, value)}
        onAddressResolved={(resolved) =>
          void applyResolvedAddress('billing', resolved).catch(() => {})
        }
      />

      <CheckoutActionRow>
        <StripeBackButton onClick={goBackCheckoutStep} disabled={stepBusy} />
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
