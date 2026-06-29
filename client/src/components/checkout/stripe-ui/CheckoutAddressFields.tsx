'use client'

import { useEffect, type ReactNode } from 'react'
import type { AddressInput } from '@/types/integrations'
import { useLocalControlledField } from '@/hooks/use-local-controlled-field'
import { useI18n } from '@/hooks/use-i18n'
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
  onChange: <K extends keyof AddressInput>(key: K, value: AddressInput[K]) => void
}

export function CheckoutAddressFields({
  prefix,
  address,
  locked,
  layout = 'stack',
  showCourierNotes = false,
  focusStreetNumber = false,
  onChange,
}: Props) {
  const { t } = useI18n()
  const streetNumberId = `${prefix}-streetNumber`
  const lockedClass = locked ? 'cursor-default bg-idl-tech-panel text-idl-graphite' : undefined
  const isCard = layout === 'card'

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
              onChange={(e) => onChange('country', e.target.value.toUpperCase().slice(0, 2))}
            >
              {CHECKOUT_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </StripeSelect>
          </StripeFieldGroup>
        </FieldBlock>

        <FieldBlock label={t('checkout.address.line1')}>
          <StripeFieldGroup>
            <StripeControlledInput
              name={`${prefix}-line1`}
              placeholder={t('checkout.address.line1')}
              value={address.line1}
              autoComplete="address-line1"
              readOnly={locked}
              className={lockedClass}
              onValueChange={(value) => onChange('line1', value)}
            />
          </StripeFieldGroup>
        </FieldBlock>

        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
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
              'flex min-h-[52px] cursor-pointer items-center gap-2.5 rounded-[11px] border border-idl-tech-border bg-idl-tech-panel px-3.5 py-3 text-sm font-medium text-idl-muted sm:min-w-[7.5rem]',
              locked && 'cursor-default bg-idl-tech-panel',
              address.isSnc && 'border-[#14161b] bg-[#f8f8f6] text-idl-graphite',
            )}
          >
            <input
              type="checkbox"
              checked={address.isSnc}
              disabled={locked}
              onChange={(e) => handleSncChange(e.target.checked)}
              className="size-4 shrink-0 rounded border-[#c0c5cc] text-idl-graphite focus:ring-[#c9a24b]/35"
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

        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_8.5rem]">
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
        onChange={(e) => onChange('country', e.target.value.toUpperCase().slice(0, 2))}
      >
        {CHECKOUT_COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.label}
          </option>
        ))}
      </StripeSelect>
      <StripeControlledInput
        name={`${prefix}-line1`}
        placeholder={t('checkout.address.line1')}
        value={address.line1}
        autoComplete="address-line1"
        readOnly={locked}
        className={lockedClass}
        onValueChange={(value) => onChange('line1', value)}
      />
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
      <div className="grid grid-cols-1 gap-0 sm:grid-cols-[1fr_auto] sm:[&>*+*]:border-l sm:[&>*+*]:border-idl-tech-border">
        <StripeControlledInput
          name={`${prefix}-city`}
          placeholder={t('checkout.address.city')}
          value={address.city}
          autoComplete="address-level2"
          readOnly={locked}
          className={lockedClass}
          onValueChange={(value) => onChange('city', value)}
        />
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

function CourierNotesField({
  name,
  value,
  locked,
  lockedClass,
  placeholder,
  onValueChange,
}: {
  name: string
  value: string
  locked: boolean
  lockedClass?: string
  placeholder: string
  onValueChange: (value: string) => void
}) {
  const field = useLocalControlledField(value, onValueChange)

  return (
    <textarea
      name={name}
      placeholder={placeholder}
      value={field.value}
      readOnly={locked}
      rows={2}
      className={cn(
        'idl-field block w-full resize-none px-[15px] py-3.5 text-[15px] outline-none placeholder:text-[#9298a3]',
        'focus:ring-2 focus:ring-[#c9a24b]/35 focus:ring-inset',
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
