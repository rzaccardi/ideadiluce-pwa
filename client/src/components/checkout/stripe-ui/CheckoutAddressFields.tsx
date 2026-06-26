'use client'

import { useEffect } from 'react'
import type { AddressInput } from '@/types/integrations'
import { useI18n } from '@/hooks/use-i18n'
import { CHECKOUT_COUNTRIES } from './constants'
import {
  StripeFieldGroup,
  StripeInput,
  StripeSelect,
} from './StripeFields'
import { cn } from '@/utils/cn'

type Props = {
  prefix: string
  address: AddressInput
  locked: boolean
  showCourierNotes?: boolean
  focusStreetNumber?: boolean
  onChange: <K extends keyof AddressInput>(key: K, value: AddressInput[K]) => void
}

export function CheckoutAddressFields({
  prefix,
  address,
  locked,
  showCourierNotes = false,
  focusStreetNumber = false,
  onChange,
}: Props) {
  const { t } = useI18n()
  const streetNumberId = `${prefix}-streetNumber`
  const lockedClass = locked ? 'cursor-default bg-zinc-50 text-zinc-900' : undefined

  useEffect(() => {
    if (focusStreetNumber && !locked) {
      document.getElementById(streetNumberId)?.focus()
    }
  }, [focusStreetNumber, locked, streetNumberId])

  function handleSncChange(checked: boolean) {
    onChange('isSnc', checked)
    if (checked) onChange('streetNumber', '')
  }

  function handleStreetNumberChange(value: string) {
    onChange('streetNumber', value)
    if (value.trim()) onChange('isSnc', false)
  }

  return (
    <>
      <StripeSelect
        name={`${prefix}-country`}
        value={address.country}
        autoComplete="country"
        disabled={locked}
        className={lockedClass}
        onChange={(e) => onChange('country', e.target.value.toUpperCase().slice(0, 2))}
      >
        {CHECKOUT_COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.label}
          </option>
        ))}
      </StripeSelect>
      <StripeInput
        name={`${prefix}-line1`}
        placeholder={t('checkout.address.line1')}
        value={address.line1}
        autoComplete="address-line1"
        readOnly={locked}
        className={lockedClass}
        onChange={(e) => onChange('line1', e.target.value)}
      />
      <div className="[&>*+*]:border-[#e2e6eb] sm:grid sm:grid-cols-[1fr_auto] sm:[&>*+*]:border-l">
        <StripeInput
          id={streetNumberId}
          name={`${prefix}-streetNumber`}
          placeholder={t('checkout.address.streetNumber')}
          value={address.streetNumber}
          autoComplete="off"
          readOnly={locked || address.isSnc}
          disabled={address.isSnc}
          className={cn(lockedClass, address.isSnc && 'opacity-60')}
          onChange={(e) => handleStreetNumberChange(e.target.value)}
        />
        <label
          className={cn(
            'flex cursor-pointer items-center gap-2 border-t border-[#e2e6eb] px-3 py-3 text-sm text-[#6c727c] sm:min-w-[7.5rem] sm:border-t-0',
            locked && 'cursor-default bg-[#f7f8fa]',
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
      <StripeInput
        name={`${prefix}-line2`}
        placeholder={t('checkout.address.line2')}
        value={address.line2 ?? ''}
        autoComplete="address-line2"
        readOnly={locked}
        className={lockedClass}
        onChange={(e) => onChange('line2', e.target.value)}
      />
      <div className="grid grid-cols-1 gap-0 sm:grid-cols-[1fr_auto] sm:[&>*+*]:border-l sm:[&>*+*]:border-[#e2e6eb]">
        <StripeInput
          name={`${prefix}-city`}
          placeholder={t('checkout.address.city')}
          value={address.city}
          autoComplete="address-level2"
          readOnly={locked}
          className={lockedClass}
          onChange={(e) => onChange('city', e.target.value)}
        />
        <StripeInput
          name={`${prefix}-postalCode`}
          placeholder={t('checkout.address.postalCode')}
          value={address.postalCode}
          autoComplete="postal-code"
          readOnly={locked}
          className={cn('sm:w-28', lockedClass)}
          onChange={(e) => onChange('postalCode', e.target.value)}
        />
      </div>
      {showCourierNotes ? (
        <textarea
          name={`${prefix}-courierNotes`}
          placeholder={t('checkout.address.courierNotes')}
          value={address.courierNotes ?? ''}
          readOnly={locked}
          rows={2}
          className={cn(
            'block w-full resize-none bg-white px-3 py-3 text-[15px] text-zinc-900 outline-none placeholder:text-zinc-400',
            'focus:ring-2 focus:ring-amber-300/60 focus:ring-inset',
            lockedClass,
          )}
          onChange={(e) => onChange('courierNotes', e.target.value)}
        />
      ) : null}
    </>
  )
}

export function CheckoutAddressFieldsManual({
  prefix,
  address,
  showCourierNotes = false,
  onChange,
}: Omit<Props, 'locked' | 'focusStreetNumber'>) {
  return (
    <StripeFieldGroup>
      <CheckoutAddressFields
        prefix={prefix}
        address={address}
        locked={false}
        showCourierNotes={showCourierNotes}
        onChange={onChange}
      />
    </StripeFieldGroup>
  )
}
