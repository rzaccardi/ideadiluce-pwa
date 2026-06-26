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
import { AddressAutocompleteField } from '@/components/checkout/AddressAutocompleteField'
import { useI18n } from '@/hooks/use-i18n'
import { CheckoutAddressFields } from './CheckoutAddressFields'
import {
  StripeFieldGroup,
  StripeInput,
  StripeSectionTitle,
} from './StripeFields'

type Props = {
  title: string
  prefix: string
  address: AddressInput
  showCourierNotes?: boolean
  showTitle?: boolean
  onChange: <K extends keyof AddressInput>(key: K, value: AddressInput[K]) => void
  onAddressResolved?: (resolved: ResolvedAddress) => void
}

export function CheckoutAddressSection({
  title,
  prefix,
  address,
  showCourierNotes = false,
  showTitle = true,
  onChange,
  onAddressResolved,
}: Props) {
  const { t } = useI18n()
  const [autocompleteEnabled, setAutocompleteEnabled] = useState(isAddressAutocompleteEnabled())
  const [addressProvider, setAddressProvider] = useState<'google' | 'mapbox' | null>(null)
  const [setupHint, setSetupHint] = useState<string | null>(null)
  const [addressSelected, setAddressSelected] = useState(() => isCheckoutAddressValid(address))
  const [detailsUnlocked, setDetailsUnlocked] = useState(false)
  const [focusStreetNumber, setFocusStreetNumber] = useState(false)
  const [resolvingPrefill, setResolvingPrefill] = useState(false)
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
    setAddressSelected(true)
    setDetailsUnlocked(false)
    setFocusStreetNumber(!resolved.streetNumber?.trim())
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
    if (!autocompleteEnabled || addressSelected || prefillAttemptedRef.current) return
    if (!hasPrefilledAddress(address)) return

    prefillAttemptedRef.current = true
    setResolvingPrefill(true)

    void (async () => {
      try {
        const resolved = await resolvePrefilledAddress(address)
        if (resolved) {
          applyResolved(resolved)
        } else if (isCheckoutAddressValid(address)) {
          setAddressSelected(true)
          setFocusStreetNumber(!address.streetNumber?.trim() && !address.isSnc)
        }
      } finally {
        setResolvingPrefill(false)
      }
    })()
  }, [autocompleteEnabled, addressSelected, addressPrefillKey])

  function handleChangeAddress() {
    setAddressSelected(false)
    setDetailsUnlocked(false)
    setFocusStreetNumber(false)
    onChange('line1', '')
    onChange('line2', '')
    onChange('streetNumber', '')
    onChange('isSnc', false)
    onChange('city', '')
    onChange('postalCode', '')
  }

  return (
    <section>
      {showTitle ? <StripeSectionTitle>{title}</StripeSectionTitle> : null}

      <StripeFieldGroup>
        <StripeInput
          name={`${prefix}-firstName`}
          placeholder={t('common.firstName')}
          value={address.firstName}
          autoComplete="given-name"
          onChange={(e) => onChange('firstName', e.target.value)}
        />
        <StripeInput
          name={`${prefix}-lastName`}
          placeholder={t('common.lastName')}
          value={address.lastName}
          autoComplete="family-name"
          onChange={(e) => onChange('lastName', e.target.value)}
        />
        <StripeInput
          name={`${prefix}-phone`}
          type="tel"
          placeholder={t('checkout.address.phoneOptional')}
          value={address.phone ?? ''}
          autoComplete="tel"
          onChange={(e) => onChange('phone', e.target.value)}
        />
      </StripeFieldGroup>

      <div className="mt-3">
        {autocompleteEnabled ? (
          addressSelected ? (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                {t('checkout.address.detailsTitle')}
              </p>
              <StripeFieldGroup>
                <CheckoutAddressFields
                  prefix={prefix}
                  address={address}
                  locked={!detailsUnlocked}
                  showCourierNotes={showCourierNotes}
                  focusStreetNumber={focusStreetNumber}
                  onChange={onChange}
                />
              </StripeFieldGroup>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                <button
                  type="button"
                  onClick={() => setDetailsUnlocked((v) => !v)}
                  className="text-sm text-zinc-900 underline decoration-zinc-300 underline-offset-2 hover:decoration-zinc-900"
                >
                  {detailsUnlocked
                    ? t('checkout.address.lockEdits')
                    : t('checkout.address.unlockEdits')}
                </button>
                <button
                  type="button"
                  onClick={handleChangeAddress}
                  className="text-sm text-zinc-900 underline decoration-zinc-300 underline-offset-2 hover:decoration-zinc-900"
                >
                  {t('checkout.address.changeAddress')}
                </button>
              </div>
            </div>
          ) : resolvingPrefill ? (
            <div className="flex items-center gap-2 px-1 py-2">
              <div className="size-4 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-600" />
              <p className="text-sm text-zinc-500">{t('checkout.address.resolvingPrefill')}</p>
            </div>
          ) : (
            <StripeFieldGroup allowOverflow>
              <AddressAutocompleteField
                label={t('checkout.address.label')}
                name={`${prefix}-search`}
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
          )
        ) : (
          <StripeFieldGroup>
            <CheckoutAddressFields
              prefix={prefix}
              address={address}
              locked={false}
              showCourierNotes={showCourierNotes}
              onChange={onChange}
            />
          </StripeFieldGroup>
        )}
      </div>

      {autocompleteEnabled && !addressSelected && !resolvingPrefill && addressProvider === 'google' ? (
        <p className="mt-1 text-xs text-zinc-500">{t('checkout.address.googleHint')}</p>
      ) : null}
      {setupHint ? <p className="mt-1 text-xs text-amber-700">{setupHint}</p> : null}
    </section>
  )
}
