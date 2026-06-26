'use client'

import { useSnapshot } from 'valtio/react'
import { checkoutStore, updateBusinessField, validateTaxFields } from '@/features/checkout'
import { useI18n } from '@/hooks/use-i18n'
import {
  StripeControlledInput,
  StripeFieldGroup,
  StripeFieldLabel,
} from './StripeFields'
import { TaxVerifyButton } from './TaxVerifyButton'
import { TaxValidationMessage } from './TaxValidationMessage'

type Props = {
  disabled?: boolean
}

export function CheckoutRetailFiscalCodeField({ disabled = false }: Props) {
  const { t } = useI18n()
  const checkout = useSnapshot(checkoutStore)
  const b = checkout.business
  const billingCountry = checkout.draft.billing.country.toUpperCase() || 'IT'
  if (billingCountry !== 'IT') return null

  const stepBusy = disabled || checkout.isLoading || checkout.addressPrefillLoading
  const fiscalFieldBusy = stepBusy || b.taxValidating

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
            required
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
    </div>
  )
}
