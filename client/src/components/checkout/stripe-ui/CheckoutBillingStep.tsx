'use client'

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
  validateCheckoutVat,
  validateTaxFields,
} from '@/features/checkout'
import { authStore } from '@/features/auth'
import { CheckoutAccountSection } from './CheckoutAccountSection'
import { CheckoutAddressSection } from './CheckoutAddressSection'
import {
  CheckoutInfoNote,
  CheckoutPanel,
  CheckoutStepHeader,
} from './CheckoutStepPrimitives'
import { useI18n } from '@/hooks/use-i18n'
import {
  CheckoutActionRow,
  StripeBackButton,
  StripeFieldGroup,
  StripeInput,
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
  const { t, tParams } = useI18n()
  const checkout = useSnapshot(checkoutStore)
  const auth = useSnapshot(authStore)
  const business = isBusinessCheckout()
  const billingCountry = checkout.draft.billing.country.toUpperCase()
  const isItaly = billingCountry === 'IT'
  const isEuVat = business && !isItaly && billingCountry !== 'IT' && /^[A-Z]{2}$/.test(billingCountry)
  const b = checkout.business

  async function handleValidateVat() {
    try {
      await validateTaxFields()
      if (isEuVat) await validateCheckoutVat()
    } catch {
      /* errore in store */
    }
  }

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

      {business ? (
        <CheckoutPanel className="space-y-3 bg-[#f7f8fa]">
          <p className="text-sm font-bold text-[#14161b]">{t('checkout.billing.businessTitle')}</p>
          <StripeFieldGroup>
            <StripeInput
              name="companyName"
              placeholder={t('checkout.billing.companyName')}
              value={checkout.business.companyName}
              onChange={(e) => updateBusinessField('companyName', e.target.value)}
            />
            <StripeInput
              name="vatNumber"
              placeholder={t('checkout.billing.vatNumber')}
              value={checkout.business.vatNumber}
              onChange={(e) => updateBusinessField('vatNumber', e.target.value.toUpperCase())}
              onBlur={() => void handleTaxBlur()}
            />
            <TaxValidationMessage
              valid={
                isItaly && b.vatNumber.trim()
                  ? b.vatChecksumValid
                  : isEuVat && b.vatNumber.trim()
                    ? b.vatFormatValid && b.vatChecksumValid
                    : null
              }
              validLabel={t('checkout.billing.vatFormatValid')}
              invalidLabel={t('checkout.billing.vatFormatInvalid')}
            />
            {(isEuVat || isItaly) && b.vatNumber.trim() ? (
              <div className="space-y-2 px-1">
                {isEuVat ? (
                  <button
                    type="button"
                    className="text-sm font-bold text-[#9a6a2f] underline underline-offset-2"
                    onClick={() => void handleValidateVat()}
                    disabled={!checkout.business.vatNumber.trim() || checkout.isLoading || b.taxValidating}
                  >
                    {t('checkout.billing.verifyVatVies')}
                  </button>
                ) : null}
                {b.viesStatus === 'valid' || b.vatValidated ? (
                  <p className="text-xs text-emerald-700">
                    {t('checkout.billing.vatViesValid')}
                    {b.vatCompanyName ? ` — ${b.vatCompanyName}` : ''}
                  </p>
                ) : b.vatForceAccepted ? (
                  <p className="text-xs text-amber-800">{t('checkout.billing.vatForceAccepted')}</p>
                ) : b.viesStatus === 'service_unavailable' ? (
                  <p className="text-xs text-amber-800">{t('checkout.billing.viesUnavailable')}</p>
                ) : b.viesStatus === 'invalid' && !isItaly ? (
                  <p className="text-xs text-red-700">{t('checkout.billing.vatViesInvalid')}</p>
                ) : isEuVat && checkout.business.vatAttempts > 0 ? (
                  <p className="text-xs text-red-700">
                    {tParams('checkout.billing.vatAttempt', {
                      current: checkout.business.vatAttempts,
                      max: 3,
                    })}
                  </p>
                ) : null}
              </div>
            ) : null}
            {isItaly ? (
              <>
                <StripeInput
                  name="fiscalCode"
                  placeholder={t('checkout.billing.fiscalCodeOptional')}
                  value={checkout.business.fiscalCode}
                  onChange={(e) => updateBusinessField('fiscalCode', e.target.value.toUpperCase())}
                  onBlur={() => void handleTaxBlur()}
                />
                <TaxValidationMessage
                  valid={b.fiscalCode.trim() ? b.fiscalCodeValid : null}
                  validLabel={t('checkout.billing.fiscalCodeValid')}
                  invalidLabel={t('checkout.billing.fiscalCodeInvalid')}
                />
                <StripeInput
                  name="pec"
                  type="email"
                  placeholder={t('checkout.billing.pec')}
                  value={checkout.business.pec}
                  onChange={(e) => updateBusinessField('pec', e.target.value)}
                />
                <StripeInput
                  name="sdiCode"
                  placeholder={t('checkout.billing.sdiCode')}
                  value={checkout.business.sdiCode}
                  onChange={(e) => updateBusinessField('sdiCode', e.target.value.toUpperCase())}
                />
              </>
            ) : null}
            <StripeInput
              name="clientOrderRef"
              placeholder={t('checkout.billing.clientOrderRefOptional')}
              value={checkout.clientOrderRef}
              onChange={(e) => updateClientOrderRef(e.target.value)}
            />
          </StripeFieldGroup>
          {isItaly ? (
            <CheckoutInfoNote>{t('checkout.billing.pecOrSdiHint')}</CheckoutInfoNote>
          ) : null}
        </CheckoutPanel>
      ) : (
        <StripeFieldGroup>
          <StripeInput
            name="fiscalCode"
            placeholder={t('checkout.billing.fiscalCodeOptional')}
            value={checkout.business.fiscalCode}
            onChange={(e) => updateBusinessField('fiscalCode', e.target.value.toUpperCase())}
            onBlur={() => void handleTaxBlur()}
          />
          <TaxValidationMessage
            valid={b.fiscalCode.trim() ? b.fiscalCodeValid : null}
            validLabel={t('checkout.billing.fiscalCodeValid')}
            invalidLabel={t('checkout.billing.fiscalCodeInvalid')}
          />
        </StripeFieldGroup>
      )}

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
        <StripeBackButton onClick={goBackCheckoutStep} />
        <StripePayButton
          className="min-w-0 flex-1"
          disabled={!canAdvanceFromStep('billing') || checkout.isLoading || b.taxValidating}
          loading={checkout.isLoading || b.taxValidating}
          onClick={() => void advanceCheckoutStep()}
        >
          {t('checkout.continueToShipping')}
        </StripePayButton>
      </CheckoutActionRow>
    </section>
  )
}
