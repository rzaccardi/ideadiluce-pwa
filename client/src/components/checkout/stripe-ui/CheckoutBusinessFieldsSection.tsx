'use client'

import { useSnapshot } from 'valtio/react'
import {
  checkoutStore,
  isBusinessCheckout,
  updateBusinessField,
  updateClientOrderRef,
  validateCheckoutVat,
  validateTaxFields,
} from '@/features/checkout'
import { CheckoutInfoNote, CheckoutPanel } from './CheckoutStepPrimitives'
import { useI18n } from '@/hooks/use-i18n'
import {
  StripeControlledInput,
  StripeFieldGroup,
  StripeFieldLabel,
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

type Props = {
  /** Mostra riferimento ordine cliente (solo step fatturazione). */
  showClientOrderRef?: boolean
  disabled?: boolean
}

export function CheckoutBusinessFieldsSection({ showClientOrderRef = false, disabled = false }: Props) {
  const { t, tParams } = useI18n()
  const checkout = useSnapshot(checkoutStore)
  const business = isBusinessCheckout()
  if (!business) return null

  const billingCountry = checkout.draft.billing.country.toUpperCase() || 'IT'
  const isItaly = billingCountry === 'IT'
  const isEuVat = !isItaly && /^[A-Z]{2}$/.test(billingCountry)
  const b = checkout.business
  const stepBusy = disabled || checkout.isLoading || b.taxValidating || checkout.addressPrefillLoading

  async function handleValidateVat() {
    try {
      await validateTaxFields()
      if (isEuVat) await validateCheckoutVat()
    } catch {
      /* errore in store */
    }
  }

  async function handleTaxBlur() {
    if (checkout.business.taxValidating || disabled) return
    try {
      await validateTaxFields()
    } catch {
      /* errore in store */
    }
  }

  return (
    <CheckoutPanel className="space-y-3 bg-[#f7f8fa]">
      <p className="text-sm font-bold text-[#14161b]">{t('checkout.billing.businessTitle')}</p>
      <div>
        <StripeFieldLabel htmlFor="companyName">{t('checkout.billing.companyName')}</StripeFieldLabel>
        <StripeFieldGroup>
          <StripeControlledInput
            id="companyName"
            name="companyName"
            placeholder={t('checkout.billing.companyName')}
            value={checkout.business.companyName}
            disabled={stepBusy}
            onValueChange={(value) => updateBusinessField('companyName', value)}
          />
        </StripeFieldGroup>
      </div>
      <div>
        <StripeFieldLabel htmlFor="vatNumber">{t('checkout.billing.vatNumber')}</StripeFieldLabel>
        <StripeFieldGroup>
          <StripeControlledInput
            id="vatNumber"
            name="vatNumber"
            placeholder="IT12345678901"
            value={checkout.business.vatNumber}
            disabled={stepBusy}
            normalize={(v) => v.toUpperCase()}
            onValueChange={(value) => updateBusinessField('vatNumber', value)}
            onBlur={() => void handleTaxBlur()}
          />
        </StripeFieldGroup>
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
      </div>
      {(isEuVat || isItaly) && b.vatNumber.trim() ? (
        <div className="space-y-2 px-1">
          {isEuVat ? (
            <button
              type="button"
              className="text-sm font-bold text-[#9a6a2f] underline underline-offset-2 disabled:opacity-50"
              onClick={() => void handleValidateVat()}
              disabled={!checkout.business.vatNumber.trim() || stepBusy}
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
          <div>
            <StripeFieldLabel htmlFor="pec">{t('checkout.billing.pec')}</StripeFieldLabel>
            <StripeFieldGroup>
              <StripeControlledInput
                id="pec"
                name="pec"
                type="email"
                placeholder="nome@pec.it"
                value={checkout.business.pec}
                disabled={stepBusy}
                onValueChange={(value) => updateBusinessField('pec', value)}
              />
            </StripeFieldGroup>
          </div>
          <div>
            <StripeFieldLabel htmlFor="sdiCode">{t('checkout.billing.sdiCode')}</StripeFieldLabel>
            <StripeFieldGroup>
              <StripeControlledInput
                id="sdiCode"
                name="sdiCode"
                placeholder="0000000"
                value={checkout.business.sdiCode}
                disabled={stepBusy}
                normalize={(v) => v.toUpperCase()}
                onValueChange={(value) => updateBusinessField('sdiCode', value)}
              />
            </StripeFieldGroup>
          </div>
          <CheckoutInfoNote>{t('checkout.billing.pecOrSdiHint')}</CheckoutInfoNote>
        </>
      ) : null}
      {showClientOrderRef ? (
        <div>
          <StripeFieldLabel htmlFor="clientOrderRef">{t('checkout.billing.clientOrderRefOptional')}</StripeFieldLabel>
          <StripeFieldGroup>
            <StripeControlledInput
              id="clientOrderRef"
              name="clientOrderRef"
              placeholder={t('checkout.billing.clientOrderRefOptional')}
              value={checkout.clientOrderRef}
              disabled={stepBusy}
              onValueChange={(value) => updateClientOrderRef(value)}
            />
          </StripeFieldGroup>
        </div>
      ) : null}
    </CheckoutPanel>
  )
}
