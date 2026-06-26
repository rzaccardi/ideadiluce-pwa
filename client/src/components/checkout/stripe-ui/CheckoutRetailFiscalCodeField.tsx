'use client'

import { useSnapshot } from 'valtio/react'
import { checkoutStore, updateBusinessField, validateTaxFields } from '@/features/checkout'
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
  disabled?: boolean
}

export function CheckoutRetailFiscalCodeField({ disabled = false }: Props) {
  const { t } = useI18n()
  const checkout = useSnapshot(checkoutStore)
  const b = checkout.business
  const billingCountry = checkout.draft.billing.country.toUpperCase() || 'IT'
  if (billingCountry !== 'IT') return null

  const stepBusy = disabled || checkout.isLoading || b.taxValidating || checkout.addressPrefillLoading

  async function handleTaxBlur() {
    if (checkout.business.taxValidating || disabled) return
    try {
      await validateTaxFields()
    } catch {
      /* errore in store */
    }
  }

  return (
    <div>
      <StripeFieldLabel htmlFor="fiscalCode">{t('checkout.billing.fiscalCode')}</StripeFieldLabel>
      <StripeFieldGroup>
        <StripeControlledInput
          id="fiscalCode"
          name="fiscalCode"
          placeholder="RSSMRA80A01H501U"
          autoComplete="off"
          value={checkout.business.fiscalCode}
          disabled={stepBusy}
          normalize={(v) => v.toUpperCase()}
          onValueChange={(value) => updateBusinessField('fiscalCode', value)}
          onBlur={() => void handleTaxBlur()}
          required
        />
      </StripeFieldGroup>
      <TaxValidationMessage
        valid={b.fiscalCode.trim() ? b.fiscalCodeValid : null}
        validLabel={t('checkout.billing.fiscalCodeValid')}
        invalidLabel={t('checkout.billing.fiscalCodeInvalid')}
      />
    </div>
  )
}
