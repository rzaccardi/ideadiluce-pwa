'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { AddressInput } from '@/types/integrations'
import type { ResolvedAddress } from '@/lib/addressAutocomplete'
import { AddressAutocompleteField } from '@/components/checkout/AddressAutocompleteField'
import { useLocalControlledField } from '@/hooks/use-local-controlled-field'
import { useI18n } from '@/hooks/use-i18n'
import { ITALIAN_PROVINCES, normalizeAddressProvince } from '@/lib/italian-provinces'
import { CHECKOUT_COUNTRIES } from './constants'
import {
  StripeFieldGroup,
  StripeFieldLabel,
  StripeControlledInput,
  StripeSelect,
} from './StripeFields'
import { cn } from '@/utils/cn'

type Props = {
  prefix: string
  address: AddressInput
  locked: boolean
  layout?: 'stack' | 'card'
  showCourierNotes?: boolean
  focusStreetNumber?: boolean
  /** Soft pulse sul campo via quando destinazione incompleta / spedizione bloccata. */
  pulseIncomplete?: boolean
  /** Autocomplete suggerimenti direttamente sul campo Indirizzo (line1). */
  line1Autocomplete?: boolean
  onLine1Resolved?: (resolved: ResolvedAddress) => void
  onSetupHint?: (hint: string | null) => void
  onChange: <K extends keyof AddressInput>(key: K, value: AddressInput[K]) => void
}

function addressHasDetailFields(address: AddressInput): boolean {
  return Boolean(
    address.streetNumber?.trim() ||
      address.city?.trim() ||
      address.postalCode?.trim() ||
      address.province?.trim() ||
      address.line2?.trim() ||
      address.isSnc,
  )
}

export function CheckoutAddressFields({
  prefix,
  address,
  locked,
  layout = 'stack',
  showCourierNotes = false,
  focusStreetNumber = false,
  pulseIncomplete = false,
  line1Autocomplete = false,
  onLine1Resolved,
  onSetupHint,
  onChange,
}: Props) {
  const { t } = useI18n()
  const streetNumberId = `${prefix}-streetNumber`
  const lockedClass = locked ? 'cursor-default bg-idl-tech-panel text-idl-graphite' : undefined
  const isCard = layout === 'card'
  const line1WrapRef = useRef<HTMLDivElement>(null)
  const didScrollLine1Ref = useRef(false)

  /** Prefill profilo / dati già presenti: dettagli visibili subito. */
  const hasDetails = addressHasDetailFields(address)
  /** Dopo selezione Places/Mapbox (anche se un campo dettaglio resta vuoto). */
  const [addressResolved, setAddressResolved] = useState(false)
  /** Fallback: blur con line1 valorizzato oppure «Inserisci manualmente». */
  const [manualEntry, setManualEntry] = useState(false)

  // Senza autocomplete (feature off): form completo.
  // Con autocomplete: solo dopo resolve / prefill reale (hasDetails) / manual entry.
  // Non espandere solo perché i campi sono locked (line1Autocomplete resta true).
  const showAddressDetails =
    !line1Autocomplete || hasDetails || addressResolved || manualEntry

  function revealManualDetails() {
    setManualEntry(true)
  }

  function handleLine1Resolved(resolved: ResolvedAddress) {
    setAddressResolved(true)
    onLine1Resolved?.(resolved)
  }

  function handleLine1Blur() {
    if (address.line1?.trim()) {
      setManualEntry(true)
    }
  }

  useEffect(() => {
    if (focusStreetNumber && showAddressDetails && !locked) {
      document.getElementById(streetNumberId)?.focus()
    }
  }, [focusStreetNumber, showAddressDetails, locked, streetNumberId])

  // Una sola volta per sessione «bloccato»: porta in vista il campo via.
  useEffect(() => {
    if (!pulseIncomplete) {
      didScrollLine1Ref.current = false
      return
    }
    if (didScrollLine1Ref.current || locked) return
    const el = line1WrapRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const fullyVisible = rect.top >= 0 && rect.bottom <= window.innerHeight
    if (fullyVisible) {
      didScrollLine1Ref.current = true
      return
    }
    didScrollLine1Ref.current = true
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [pulseIncomplete, locked])

  function handleSncChange(checked: boolean) {
    onChange('isSnc', checked)
    if (checked) onChange('streetNumber', '')
  }

  function handleStreetNumberChange(value: string) {
    onChange('streetNumber', value)
    if (value.trim()) onChange('isSnc', false)
  }

  function handleCountryChange(value: string) {
    const country = value.toUpperCase().slice(0, 2)
    onChange('country', country)
    onChange('province', normalizeAddressProvince(country, address.province))
  }

  function provinceControl(className?: string) {
    if (address.country === 'IT') {
      return (
        <StripeSelect
          name={`${prefix}-province`}
          value={ITALIAN_PROVINCES.some((row) => row.code === address.province) ? address.province : ''}
          autoComplete="address-level1"
          disabled={locked}
          className={cn(lockedClass, className)}
          onChange={(e) => onChange('province', e.target.value.toUpperCase())}
        >
          <option value="">{t('checkout.address.province')}</option>
          {ITALIAN_PROVINCES.map((row) => (
            <option key={row.code} value={row.code}>
              {row.code} - {row.name}
            </option>
          ))}
        </StripeSelect>
      )
    }
    return (
      <StripeControlledInput
        name={`${prefix}-province`}
        placeholder={t('checkout.address.province')}
        value={address.province}
        autoComplete="address-level1"
        readOnly={locked}
        className={cn(lockedClass, className)}
        onValueChange={(value) => onChange('province', value)}
      />
    )
  }

  if (isCard) {
    return (
      <div className="space-y-4">
        <FieldBlock label={t('checkout.address.country')}>
          <StripeFieldGroup>
            <StripeSelect
              name={`${prefix}-country`}
              value={address.country}
              autoComplete="country"
              disabled={locked}
              className={lockedClass}
              onChange={(e) => handleCountryChange(e.target.value)}
            >
              {CHECKOUT_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </StripeSelect>
          </StripeFieldGroup>
        </FieldBlock>

        <div ref={line1WrapRef}>
          <FieldBlock label={t('checkout.address.line1')}>
            {line1Autocomplete && !locked ? (
              <StripeFieldGroup
                allowOverflow
                className={cn(pulseIncomplete && 'border-amber-300/80')}
              >
                <AddressAutocompleteField
                  label={t('checkout.address.line1')}
                  name={`${prefix}-line1`}
                  value={address.line1}
                  countryBias={address.country}
                  variant="stripe"
                  placeholder={t('checkout.address.line1Placeholder')}
                  pulseHint={pulseIncomplete}
                  onChange={(value) => onChange('line1', value)}
                  onResolved={handleLine1Resolved}
                  onSetupHint={onSetupHint}
                  onBlur={handleLine1Blur}
                />
              </StripeFieldGroup>
            ) : (
              <StripeFieldGroup className={cn(pulseIncomplete && 'border-amber-300/80')}>
                <StripeControlledInput
                  name={`${prefix}-line1`}
                  placeholder={t('checkout.address.line1Placeholder')}
                  value={address.line1}
                  autoComplete="address-line1"
                  readOnly={locked}
                  className={cn(lockedClass, pulseIncomplete && 'idl-checkout-line1-pulse')}
                  onValueChange={(value) => onChange('line1', value)}
                />
              </StripeFieldGroup>
            )}
          </FieldBlock>
        </div>

        {line1Autocomplete && !locked && !showAddressDetails ? (
          <button
            type="button"
            className="text-sm font-medium text-idl-muted underline decoration-idl-tech-border underline-offset-2 hover:text-idl-graphite hover:decoration-idl-graphite"
            onClick={revealManualDetails}
          >
            {t('checkout.address.enterManually')}
          </button>
        ) : null}

        {showAddressDetails ? (
          <>
            <div
              className={cn(
                'grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end',
                focusStreetNumber && 'rounded-[12px] ring-2 ring-amber-300/70 ring-offset-2',
              )}
            >
              <FieldBlock label={t('checkout.address.streetNumber')}>
                <StripeFieldGroup>
                  <StripeControlledInput
                    id={streetNumberId}
                    name={`${prefix}-streetNumber`}
                    placeholder="12"
                    value={address.streetNumber}
                    autoComplete="off"
                    readOnly={locked || address.isSnc}
                    disabled={address.isSnc}
                    className={cn(lockedClass, address.isSnc && 'opacity-60')}
                    onValueChange={(value) => handleStreetNumberChange(value)}
                  />
                </StripeFieldGroup>
              </FieldBlock>
              <label
                className={cn(
                  'flex min-h-[52px] cursor-pointer items-center gap-2.5 rounded-[11px] border border-idl-tech-border bg-idl-tech-panel px-3.5 py-3 text-sm font-medium text-idl-muted sm:min-w-[9.5rem]',
                  locked && 'cursor-default bg-idl-tech-panel',
                  address.isSnc && 'border-[#14161b] bg-[#f4f5f7] text-idl-graphite',
                  focusStreetNumber && !address.isSnc && 'border-amber-300 bg-amber-50/70',
                )}
              >
                <input
                  type="checkbox"
                  checked={address.isSnc}
                  disabled={locked}
                  onChange={(e) => handleSncChange(e.target.checked)}
                  className="size-4 shrink-0 rounded border-[#c0c5cc] text-idl-graphite focus:ring-[#0c0c0d]/35"
                />
                <span>{t('checkout.address.isSnc')}</span>
              </label>
            </div>

            {focusStreetNumber && !address.isSnc && !address.streetNumber.trim() ? (
              <p className="-mt-2 text-xs text-amber-700">{t('checkout.address.streetNumberHint')}</p>
            ) : null}

            <FieldBlock label={t('checkout.address.line2')}>
              <StripeFieldGroup>
                <StripeControlledInput
                  name={`${prefix}-line2`}
                  placeholder={t('checkout.address.line2')}
                  value={address.line2 ?? ''}
                  autoComplete="address-line2"
                  readOnly={locked}
                  className={lockedClass}
                  onValueChange={(value) => onChange('line2', value)}
                />
              </StripeFieldGroup>
            </FieldBlock>

            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_6.75rem_8.5rem]">
              <FieldBlock label={t('checkout.address.city')}>
                <StripeFieldGroup>
                  <StripeControlledInput
                    name={`${prefix}-city`}
                    placeholder={t('checkout.address.city')}
                    value={address.city}
                    autoComplete="address-level2"
                    readOnly={locked}
                    className={lockedClass}
                    onValueChange={(value) => onChange('city', value)}
                  />
                </StripeFieldGroup>
              </FieldBlock>
              <FieldBlock label={t('checkout.address.province')}>
                <StripeFieldGroup>{provinceControl()}</StripeFieldGroup>
              </FieldBlock>
              <FieldBlock label={t('checkout.address.postalCode')}>
                <StripeFieldGroup>
                  <StripeControlledInput
                    name={`${prefix}-postalCode`}
                    placeholder="00100"
                    value={address.postalCode}
                    autoComplete="postal-code"
                    readOnly={locked}
                    className={lockedClass}
                    onValueChange={(value) => onChange('postalCode', value)}
                  />
                </StripeFieldGroup>
              </FieldBlock>
            </div>

            {showCourierNotes ? (
              <FieldBlock label={t('checkout.address.courierNotes')}>
                <StripeFieldGroup>
                  <CourierNotesField
                    name={`${prefix}-courierNotes`}
                    value={address.courierNotes ?? ''}
                    locked={locked}
                    lockedClass={lockedClass}
                    placeholder={t('checkout.address.courierNotes')}
                    onValueChange={(value) => onChange('courierNotes', value)}
                  />
                </StripeFieldGroup>
              </FieldBlock>
            ) : null}
          </>
        ) : null}
      </div>
    )
  }

  return (
    <>
      <StripeSelect
        name={`${prefix}-country`}
        value={address.country}
        autoComplete="country"
        disabled={locked}
        className={lockedClass}
        onChange={(e) => handleCountryChange(e.target.value)}
      >
        {CHECKOUT_COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.label}
          </option>
        ))}
      </StripeSelect>
      <StripeControlledInput
        name={`${prefix}-line1`}
        placeholder={t('checkout.address.line1Placeholder')}
        value={address.line1}
        autoComplete="address-line1"
        readOnly={locked}
        className={lockedClass}
        onValueChange={(value) => onChange('line1', value)}
      />
      {showAddressDetails ? (
        <>
          <div className="[&>*+*]:border-idl-tech-border sm:grid sm:grid-cols-[1fr_auto] sm:[&>*+*]:border-l">
            <StripeControlledInput
              id={streetNumberId}
              name={`${prefix}-streetNumber`}
              placeholder={t('checkout.address.streetNumber')}
              value={address.streetNumber}
              autoComplete="off"
              readOnly={locked || address.isSnc}
              disabled={address.isSnc}
              className={cn(lockedClass, address.isSnc && 'opacity-60')}
              onValueChange={(value) => handleStreetNumberChange(value)}
            />
            <label
              className={cn(
                'flex cursor-pointer items-center gap-2 border-t border-idl-tech-border px-3 py-3 text-sm text-idl-muted sm:min-w-[7.5rem] sm:border-t-0',
                locked && 'cursor-default bg-idl-tech-panel',
              )}
            >
              <input
                type="checkbox"
                checked={address.isSnc}
                disabled={locked}
                onChange={(e) => handleSncChange(e.target.checked)}
                className="size-4 shrink-0 rounded border-zinc-300 text-black focus:ring-amber-300/60"
              />
              <span>{t('checkout.address.isSnc')}</span>
            </label>
          </div>
          {focusStreetNumber && !address.isSnc && !address.streetNumber.trim() ? (
            <p className="px-3 py-2 text-xs text-amber-700">{t('checkout.address.streetNumberHint')}</p>
          ) : null}
          <StripeControlledInput
            name={`${prefix}-line2`}
            placeholder={t('checkout.address.line2')}
            value={address.line2 ?? ''}
            autoComplete="address-line2"
            readOnly={locked}
            className={lockedClass}
            onValueChange={(value) => onChange('line2', value)}
          />
          <div className="grid grid-cols-1 gap-0 sm:grid-cols-[minmax(0,1fr)_6.75rem_7rem] sm:[&>*+*]:border-l sm:[&>*+*]:border-idl-tech-border">
            <StripeControlledInput
              name={`${prefix}-city`}
              placeholder={t('checkout.address.city')}
              value={address.city}
              autoComplete="address-level2"
              readOnly={locked}
              className={lockedClass}
              onValueChange={(value) => onChange('city', value)}
            />
            {provinceControl()}
            <StripeControlledInput
              name={`${prefix}-postalCode`}
              placeholder={t('checkout.address.postalCode')}
              value={address.postalCode}
              autoComplete="postal-code"
              readOnly={locked}
              className={cn('sm:w-28', lockedClass)}
              onValueChange={(value) => onChange('postalCode', value)}
            />
          </div>
          {showCourierNotes ? (
            <CourierNotesField
              name={`${prefix}-courierNotes`}
              value={address.courierNotes ?? ''}
              locked={locked}
              lockedClass={lockedClass}
              placeholder={t('checkout.address.courierNotes')}
              onValueChange={(value) => onChange('courierNotes', value)}
            />
          ) : null}
        </>
      ) : null}
    </>
  )
}

function FieldBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <StripeFieldLabel>{label}</StripeFieldLabel>
      {children}
    </div>
  )
}

export function CourierNotesField({
  id,
  name,
  value,
  locked = false,
  lockedClass,
  placeholder,
  onValueChange,
}: {
  id?: string
  name: string
  value: string
  locked?: boolean
  lockedClass?: string
  placeholder: string
  onValueChange: (value: string) => void
}) {
  const field = useLocalControlledField(value, onValueChange)

  return (
    <textarea
      id={id}
      name={name}
      placeholder={placeholder}
      value={field.value}
      readOnly={locked}
      rows={2}
      className={cn(
        'idl-field block w-full resize-none px-[15px] py-3.5 text-[15px] outline-none placeholder:text-[#9298a3]',
        'focus:ring-2 focus:ring-[#0c0c0d]/35 focus:ring-inset',
        lockedClass,
      )}
      onChange={field.onChange}
      onFocus={field.onFocus}
      onBlur={field.onBlur}
    />
  )
}

export function CheckoutAddressFieldsManual({
  prefix,
  address,
  showCourierNotes = false,
  onChange,
}: Omit<Props, 'locked' | 'focusStreetNumber' | 'layout'>) {
  return (
    <CheckoutPanelFields>
      <CheckoutAddressFields
        layout="card"
        prefix={prefix}
        address={address}
        locked={false}
        showCourierNotes={showCourierNotes}
        onChange={onChange}
      />
    </CheckoutPanelFields>
  )
}

function CheckoutPanelFields({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-idl-tech-border bg-idl-tech-panel p-4 shadow-[0_1px_2px_rgba(20,22,27,0.04)] sm:p-5">
      {children}
    </div>
  )
}
