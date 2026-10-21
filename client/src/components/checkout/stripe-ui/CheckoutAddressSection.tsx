'use client'

import { useEffect, useRef, useState } from 'react'
import type { AddressInput } from '@/types/integrations'
import type { ResolvedAddress } from '@/lib/addressAutocomplete'
import {
  hasPrefilledAddress,
  isAddressAutocompleteEnabled,
  refreshAddressAutocompleteStatus,
  fetchAddressAutocompleteStatus,
  resolvePrefilledAddress,
} from '@/lib/addressAutocomplete'
import { isCheckoutAddressValid, isCheckoutPhoneValid, mergeResolvedStreetNumber } from '@/lib/checkout-address.validators'
import { checkoutStore } from '@/features/checkout'
import { PhonePrefixField } from '@/components/PhonePrefixField'
import { useI18n } from '@/hooks/use-i18n'
import { CheckoutAddressFields } from './CheckoutAddressFields'
import {
  StripeFieldGroup,
  StripeControlledInput,
  StripeFieldLabel,
  StripeSectionTitle,
} from './StripeFields'

type Props = {
  title: string
  prefix: string
  address: AddressInput
  showCourierNotes?: boolean
  showTitle?: boolean
  /** Nasconde nome, cognome e telefono (es. indirizzo di sola fatturazione). */
  hideContactFields?: boolean
  /** Evidenzia il telefono mancante/non valido (metodi spedizione bloccati). */
  highlightPhoneError?: boolean
  /**
   * Destinazione incompleta + metodi spedizione locked: pulse soft sul campo via
   * (non se manca solo il civico — lì resta focusStreetNumber).
   */
  highlightIncompleteAddress?: boolean
  disabled?: boolean
  onChange: <K extends keyof AddressInput>(key: K, value: AddressInput[K]) => void
  onAddressResolved?: (resolved: ResolvedAddress) => void
}

function hasResolvedAddressCore(address: AddressInput): boolean {
  return (
    address.line1.trim().length >= 3 &&
    address.city.trim().length >= 2 &&
    address.postalCode.trim().length >= 1 &&
    address.country.trim().length === 2
  )
}

function needsStreetNumberChoice(address: AddressInput): boolean {
  return hasResolvedAddressCore(address) && !address.streetNumber.trim() && !address.isSnc
}

export function CheckoutAddressSection({
  title,
  prefix,
  address,
  showCourierNotes = false,
  showTitle = false,
  hideContactFields = false,
  highlightPhoneError = false,
  highlightIncompleteAddress = false,
  disabled = false,
  onChange,
  onAddressResolved,
}: Props) {
  const { t } = useI18n()
  const [autocompleteEnabled, setAutocompleteEnabled] = useState(isAddressAutocompleteEnabled())
  const [setupHint, setSetupHint] = useState<string | null>(null)
  const [focusStreetNumber, setFocusStreetNumber] = useState(() => needsStreetNumberChoice(address))
  const prefillAttemptedRef = useRef(false)
  const addressGeocodeKey = [address.line1, address.city, address.postalCode, address.country].join('|')

  useEffect(() => {
    if (address.streetNumber.trim() || address.isSnc) {
      setFocusStreetNumber(false)
    } else if (hasResolvedAddressCore(address)) {
      setFocusStreetNumber(true)
    }
  }, [address.streetNumber, address.isSnc, address.line1, address.city, address.postalCode, address.country])

  useEffect(() => {
    void (async () => {
      const enabled = await refreshAddressAutocompleteStatus()
      setAutocompleteEnabled(enabled)
      if (enabled) {
        try {
          const status = await fetchAddressAutocompleteStatus()
          setSetupHint(status.setupHint ?? null)
        } catch {
          setSetupHint(null)
        }
      }
    })()
  }, [])

  function applyResolved(resolved: ResolvedAddress) {
    const merged = mergeResolvedStreetNumber(address, resolved)
    setFocusStreetNumber(!merged.streetNumber.trim() && !merged.isSnc)
    if (onAddressResolved) {
      onAddressResolved({
        ...resolved,
        line1: merged.line1,
        streetNumber: merged.streetNumber || undefined,
      })
      return
    }
    onChange('line1', merged.line1)
    onChange('streetNumber', merged.streetNumber)
    onChange('isSnc', merged.isSnc)
    onChange('line2', resolved.line2 ?? '')
    onChange('city', resolved.city)
    onChange('postalCode', resolved.postalCode)
    onChange('province', resolved.province ?? '')
    onChange('country', resolved.country)
  }

  useEffect(() => {
    if (!autocompleteEnabled || prefillAttemptedRef.current || disabled) return
    if (!hasPrefilledAddress(address)) return
    if (isCheckoutAddressValid(address)) {
      return
    }

    prefillAttemptedRef.current = true
    checkoutStore.addressPrefillLoading = true

    void (async () => {
      try {
        const resolved = await resolvePrefilledAddress(address)
        if (resolved) {
          applyResolved(resolved)
        } else if (hasResolvedAddressCore(address)) {
          setFocusStreetNumber(needsStreetNumberChoice(address))
        }
      } finally {
        checkoutStore.addressPrefillLoading = false
      }
    })()
  }, [autocompleteEnabled, addressGeocodeKey, disabled])

  const civicoRequired = needsStreetNumberChoice(address)
  const pulseLine1 =
    highlightIncompleteAddress && !civicoRequired && !disabled
  const phoneInvalid =
    highlightPhoneError ||
    (Boolean((address.phone ?? '').trim()) && !isCheckoutPhoneValid(address.phone ?? ''))
  const showPhoneError =
    highlightPhoneError && !isCheckoutPhoneValid(address.phone ?? '')

  return (
    <section className="space-y-4">
      {showTitle ? <StripeSectionTitle>{title}</StripeSectionTitle> : null}

      {!hideContactFields ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <StripeFieldLabel htmlFor={`${prefix}-firstName`}>{t('common.firstName')}</StripeFieldLabel>
              <StripeFieldGroup>
                <StripeControlledInput
                  id={`${prefix}-firstName`}
                  name={`${prefix}-firstName`}
                  placeholder={t('common.firstName')}
                  value={address.firstName}
                  autoComplete="given-name"
                  readOnly={disabled}
                  onValueChange={(value) => onChange('firstName', value)}
                />
              </StripeFieldGroup>
            </div>
            <div>
              <StripeFieldLabel htmlFor={`${prefix}-lastName`}>{t('common.lastName')}</StripeFieldLabel>
              <StripeFieldGroup>
                <StripeControlledInput
                  id={`${prefix}-lastName`}
                  name={`${prefix}-lastName`}
                  placeholder={t('common.lastName')}
                  value={address.lastName}
                  autoComplete="family-name"
                  readOnly={disabled}
                  onValueChange={(value) => onChange('lastName', value)}
                />
              </StripeFieldGroup>
            </div>
          </div>

          <div>
            <StripeFieldLabel htmlFor={`${prefix}-phone`}>{t('common.phone')}</StripeFieldLabel>
            <StripeFieldGroup
              className={
                phoneInvalid
                  ? 'border-red-500 shadow-none ring-2 ring-red-200'
                  : undefined
              }
            >
              <PhonePrefixField
                id={`${prefix}-phone`}
                name={`${prefix}-phone`}
                value={address.phone ?? ''}
                defaultCountry={address.country}
                required
                invalid={phoneInvalid}
                disabled={disabled}
                onValueChange={(value) => onChange('phone', value)}
              />
            </StripeFieldGroup>
            {showPhoneError ? (
              <p
                className="mt-2 rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
                role="alert"
              >
                {t('checkout.shipping.phoneRequired')}
              </p>
            ) : null}
          </div>
        </>
      ) : null}

      {civicoRequired ? (
        <p className="rounded-[10px] border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm leading-relaxed text-amber-900">
          {t('checkout.address.streetNumberHint')}
        </p>
      ) : null}

      <CheckoutAddressFields
        layout="card"
        prefix={prefix}
        address={address}
        locked={disabled}
        showCourierNotes={showCourierNotes}
        focusStreetNumber={focusStreetNumber}
        pulseIncomplete={pulseLine1}
        // Non legare a `disabled`: se autocomplete spegne per locked, showAddressDetails
        // diventa true e i dettagli (civico/città/CAP) si espandono a torto.
        line1Autocomplete={autocompleteEnabled}
        onSetupHint={setSetupHint}
        onLine1Resolved={(resolved) => applyResolved(resolved)}
        onChange={onChange}
      />

      {setupHint && autocompleteEnabled ? (
        <p className="text-xs text-amber-800">{setupHint}</p>
      ) : null}
    </section>
  )
}
