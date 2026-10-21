'use client'

import type { ReactNode } from 'react'
import { useSnapshot } from 'valtio/react'
import {
  checkoutStore,
  isBusinessCheckout,
  setBusinessNoVatNumber,
  updateBusinessField,
  updateClientOrderRef,
  validateCheckoutVat,
  validateTaxFields,
} from '@/features/checkout'
import { CheckoutToggleCheckbox } from './CheckoutStepPrimitives'
import { useI18n } from '@/hooks/use-i18n'
import {
  StripeControlledInput,
  StripeFieldGroup,
  StripeFieldLabel,
} from './StripeFields'
import { TaxVerifyButton } from './TaxVerifyButton'
import { TaxValidationMessage } from './TaxValidationMessage'

type Props = {
  /** Mostra riferimento ordine cliente (solo step fatturazione). */
  showClientOrderRef?: boolean
  disabled?: boolean
  /** Senza pannello/titolo: stessi input del form registrazione. */
  embedded?: boolean
}

export function CheckoutBusinessFieldsSection({
  showClientOrderRef = false,
  disabled = false,
  embedded = false,
}: Props) {
  const { t, tParams } = useI18n()
  const checkout = useSnapshot(checkoutStore)
  const business = isBusinessCheckout()
  if (!business) return null

  const billingCountry = checkout.draft.billing.country.toUpperCase() || 'IT'
  const isItaly = billingCountry === 'IT'
  const isEuVat = !isItaly && /^[A-Z]{2}$/.test(billingCountry)
  const b = checkout.business
  const noVat = b.noVatNumber
  const stepBusy =
    disabled || checkout.isLoading || checkout.initLoadingPhase != null || checkout.addressPrefillLoading
  const vatFieldBusy = stepBusy || b.taxValidating
  const fiscalFieldBusy = stepBusy || b.taxValidating

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

  function fieldLabel(id: string, label: string, input: ReactNode) {
    if (embedded) return input
    return (
      <div>
        <StripeFieldLabel htmlFor={id}>{label}</StripeFieldLabel>
        {input}
      </div>
    )
  }

  const fields = (
    <>
      {fieldLabel(
        'companyName',
        t('checkout.billing.companyName'),
        <StripeFieldGroup>
          <StripeControlledInput
            id="companyName"
            name="companyName"
            placeholder={t('checkout.billing.companyName')}
            value={checkout.business.companyName}
            disabled={stepBusy}
            onValueChange={(value) => updateBusinessField('companyName', value)}
          />
        </StripeFieldGroup>,
      )}
      <CheckoutToggleCheckbox
        checked={noVat}
        disabled={stepBusy}
        label={t('checkout.billing.noVatNumber')}
        onChange={setBusinessNoVatNumber}
      />
      {noVat ? (
        fieldLabel(
          'fiscalCode',
          t('checkout.billing.fiscalCode'),
          <>
            <div className="flex items-stretch gap-2">
              <StripeFieldGroup className="min-w-0 flex-1">
                <StripeControlledInput
                  id="fiscalCode"
                  name="fiscalCode"
                  placeholder="RSSMRA80A01H501U"
                  autoComplete="off"
                  value={checkout.business.fiscalCode}
                  disabled={fiscalFieldBusy}
                  normalize={(v) => v.toUpperCase()}
                  onValueChange={(value) => updateBusinessField('fiscalCode', value)}
                  onBlur={() => void handleTaxBlur()}
                />
              </StripeFieldGroup>
              <TaxVerifyButton
                onClick={() => void handleTaxBlur()}
                disabled={!b.fiscalCode.trim() || fiscalFieldBusy}
                loading={b.taxValidating}
                verified={b.fiscalCodeValid === true}
              />
            </div>
            <TaxValidationMessage
              valid={b.fiscalCode.trim() ? b.fiscalCodeValid : null}
              validLabel={t('checkout.billing.fiscalCodeValid')}
              invalidLabel={t('checkout.billing.fiscalCodeInvalid')}
              errorMessage={b.fiscalCode.trim() ? b.fiscalCodeError : null}
            />
          </>,
        )
      ) : (
        fieldLabel(
          'vatNumber',
          t('checkout.billing.vatNumber'),
          <>
            <div className="flex items-stretch gap-2">
              <StripeFieldGroup className="min-w-0 flex-1">
                <StripeControlledInput
                  id="vatNumber"
                  name="vatNumber"
                  placeholder="IT12345678901"
                  value={checkout.business.vatNumber}
                  disabled={vatFieldBusy}
                  normalize={(v) => v.toUpperCase()}
                  onValueChange={(value) => updateBusinessField('vatNumber', value)}
                  onBlur={() => void handleTaxBlur()}
                />
              </StripeFieldGroup>
              <TaxVerifyButton
                onClick={() => void (isEuVat ? handleValidateVat() : handleTaxBlur())}
                disabled={!checkout.business.vatNumber.trim() || vatFieldBusy}
                loading={b.taxValidating}
                verified={
                  isItaly
                    ? b.vatChecksumValid === true
                    : isEuVat
                      ? b.vatFormatValid === true && b.vatChecksumValid === true
                      : false
                }
              />
            </div>
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
              errorMessage={b.vatNumber.trim() ? b.vatError : null}
            />
          </>,
        )
      )}
      {!noVat && (isEuVat || isItaly) && b.vatNumber.trim() ? (
        <div className={embedded ? 'space-y-2' : 'space-y-2 px-1'}>
          {b.viesStatus === 'valid' || b.vatValidated ? (
            <p className="text-xs text-emerald-700">
              {t('checkout.billing.vatViesValid')}
              {b.vatCompanyName ? ` - ${b.vatCompanyName}` : ''}
            </p>
          ) : b.vatForceAccepted ? (
            <p className="text-xs text-amber-800">{t('checkout.billing.vatForceAccepted')}</p>
          ) : b.viesStatus === 'service_unavailable' ? (
            <p className="text-xs text-amber-800">{t('checkout.billing.viesUnavailable')}</p>
          ) : b.viesStatus === 'invalid' && !isItaly ? (
            <p className="text-xs text-red-700">
              {b.vatError ?? t('checkout.billing.vatViesInvalid')}
            </p>
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
      {isItaly
        ? fieldLabel(
            'sdiCode',
            t('checkout.billing.sdiCode'),
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
            </StripeFieldGroup>,
          )
        : null}
      {showClientOrderRef
        ? fieldLabel(
            'clientOrderRef',
            t('checkout.billing.clientOrderRefOptional'),
            <StripeFieldGroup>
              <StripeControlledInput
                id="clientOrderRef"
                name="clientOrderRef"
                placeholder={t('checkout.billing.clientOrderRefOptional')}
                value={checkout.clientOrderRef}
                disabled={stepBusy}
                onValueChange={(value) => updateClientOrderRef(value)}
              />
            </StripeFieldGroup>,
          )
        : null}
    </>
  )

  if (embedded) {
    return <>{fields}</>
  }

  // Flat stack come CF retail: niente card/pannello dedicato.
  return <div className="space-y-3">{fields}</div>
}
