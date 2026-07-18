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
import { isCheckoutAddressValid } from '@/lib/checkout-address.validators'
import { checkoutStore } from '@/features/checkout'
import { AddressAutocompleteField } from '@/components/checkout/AddressAutocompleteField'
import { useI18n } from '@/hooks/use-i18n'
import { CheckoutAddressFields } from './CheckoutAddressFields'
import {
  StripeFieldGroup,
  StripeFieldLabel,
  StripeControlledInput,
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
  onChange,
  onAddressResolved,
}: Props) {
  const { t } = useI18n()
  const [autocompleteEnabled, setAutocompleteEnabled] = useState(isAddressAutocompleteEnabled())
  const [addressProvider, setAddressProvider] = useState<'google' | 'mapbox' | null>(null)
  const [setupHint, setSetupHint] = useState<string | null>(null)
  const [focusStreetNumber, setFocusStreetNumber] = useState(() => needsStreetNumberChoice(address))
  const searchInputName = `${prefix}-search`
  const prefillAttemptedRef = useRef(false)
  const addressPrefillKey = [
    address.line1,
    address.streetNumber,
    address.isSnc ? 'snc' : '',
    address.city,
    address.postalCode,
    address.country,
  ].join('|')

  useEffect(() => {
    prefillAttemptedRef.current = false
  }, [addressPrefillKey])

  useEffect(() => {
    if (address.streetNumber.trim() || address.isSnc) {
      setFocusStreetNumber(false)
    } else if (hasResolvedAddressCore(address)) {
      setFocusStreetNumber(true)
    }
  }, [addressPrefillKey, address.streetNumber, address.isSnc])

  useEffect(() => {
    void (async () => {
      const enabled = await refreshAddressAutocompleteStatus()
      setAutocompleteEnabled(enabled)
      if (enabled) {
        try {
          const status = await fetchAddressAutocompleteStatus()
          setAddressProvider(status.provider)
          setSetupHint(status.setupHint ?? null)
        } catch {
          setAddressProvider(null)
        }
      }
    })()
  }, [])

  function applyResolved(resolved: ResolvedAddress) {
    const missingStreetNumber = !resolved.streetNumber?.trim()
    setFocusStreetNumber(missingStreetNumber)
    if (onAddressResolved) {
      onAddressResolved(resolved)
      return
    }
    onChange('line1', resolved.line1)
    onChange('streetNumber', resolved.streetNumber ?? '')
    onChange('isSnc', false)
    onChange('line2', resolved.line2 ?? '')
    onChange('city', resolved.city)
    onChange('postalCode', resolved.postalCode)
    onChange('country', resolved.country)
  }

  function handleAddressResolved(resolved: ResolvedAddress) {
    applyResolved(resolved)
  }

  useEffect(() => {
    if (!autocompleteEnabled || prefillAttemptedRef.current) return
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
  }, [autocompleteEnabled, addressPrefillKey])

  function handleChangeAddress() {
    prefillAttemptedRef.current = true
    setFocusStreetNumber(false)
    onChange('line1', '')
    onChange('line2', '')
    onChange('streetNumber', '')
    onChange('isSnc', false)
    onChange('city', '')
    onChange('postalCode', '')
    requestAnimationFrame(() => {
      document.getElementById(searchInputName)?.focus()
    })
  }

  const civicoRequired = needsStreetNumberChoice(address)
  const hasAddressCore = hasResolvedAddressCore(address)

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
                  onValueChange={(value) => onChange('lastName', value)}
                />
              </StripeFieldGroup>
            </div>
          </div>

          <div>
            <StripeFieldLabel htmlFor={`${prefix}-phone`}>{t('checkout.address.phoneOptional')}</StripeFieldLabel>
            <StripeFieldGroup>
              <StripeControlledInput
                id={`${prefix}-phone`}
                name={`${prefix}-phone`}
                type="tel"
                placeholder="+39 333 1234567"
                value={address.phone ?? ''}
                autoComplete="tel"
                onValueChange={(value) => onChange('phone', value)}
              />
            </StripeFieldGroup>
          </div>
        </>
      ) : null}

      {autocompleteEnabled ? (
        <div className="rounded-[14px] border border-[#d9c9a8] bg-[#f3eee4] p-4 shadow-[0_1px_2px_rgba(20,22,27,0.04)] sm:p-5">
          <p className="text-[13px] font-bold tracking-[-0.01em] text-idl-graphite">
            {t('checkout.address.autofillBanner')}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[#7a6f5c]">
            {addressProvider === 'google'
              ? t('checkout.address.googleHint')
              : t('checkout.address.autofillHint')}
          </p>
          <div className="mt-3">
            <StripeFieldGroup allowOverflow>
              <AddressAutocompleteField
                label={t('checkout.address.autofillBanner')}
                name={searchInputName}
                value={address.line1}
                countryBias={address.country}
                variant="stripe"
                autoComplete="off"
                placeholder={t('checkout.address.searchPlaceholder')}
                onChange={(value) => onChange('line1', value)}
                onResolved={handleAddressResolved}
                onSetupHint={setSetupHint}
              />
            </StripeFieldGroup>
          </div>
          {setupHint ? <p className="mt-2 text-xs text-amber-800">{setupHint}</p> : null}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-[14px] border border-idl-tech-border bg-idl-tech-panel p-4 shadow-[0_1px_2px_rgba(20,22,27,0.04)] sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[13px] font-semibold text-idl-graphite">{t('checkout.address.detailsTitle')}</p>
          {autocompleteEnabled && hasAddressCore ? (
            <button
              type="button"
              onClick={handleChangeAddress}
              className="text-sm font-semibold text-[#9a7b33] underline decoration-[#cdbfa5] underline-offset-2 hover:decoration-[#9a7b33]"
            >
              {t('checkout.address.changeAddress')}
            </button>
          ) : null}
        </div>
        {civicoRequired ? (
          <p className="mb-3 rounded-[10px] border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm leading-relaxed text-amber-900">
            {t('checkout.address.streetNumberHint')}
          </p>
        ) : null}
        <CheckoutAddressFields
          layout="card"
          prefix={prefix}
          address={address}
          locked={false}
          showCourierNotes={showCourierNotes}
          focusStreetNumber={focusStreetNumber}
          onChange={onChange}
        />
      </div>
    </section>
  )
}
