'use client'

import type { ComponentType } from 'react'
import { useI18n } from '@/hooks/use-i18n'
import { cn } from '@/utils/cn'

const CUSTOMER_TYPES = ['retail', 'business'] as const
export type CheckoutCustomerTypeValue = (typeof CUSTOMER_TYPES)[number]

export function PersonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M5.5 19.5c.9-3.2 3.4-5 6.5-5s5.6 1.8 6.5 5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 20V9.5l7-4.5 7 4.5V20"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M9.5 20v-5h5v5" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <path d="M9 12.5h1.5M13.5 12.5H15M9 15h1.5M13.5 15H15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

export function LoginIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M10 17l5-5-5-5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M15 12H4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path
        d="M14 4h4.5A1.5 1.5 0 0120 5.5v13a1.5 1.5 0 01-1.5 1.5H14"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** Toggle a 2 tab condiviso (Privato/Azienda, Registrati/Accedi). */
export function CheckoutChoiceTabs<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  disabled,
  className,
}: {
  value: T
  options: Array<{ value: T; label: string; icon: ComponentType<{ className?: string }> }>
  onChange: (value: T) => void
  ariaLabel: string
  disabled?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-2 rounded-xl border border-idl-tech-border bg-idl-tech-panel p-1.5',
        className,
      )}
      role="tablist"
      aria-label={ariaLabel}
    >
      {options.map((option) => {
        const selected = value === option.value
        const Icon = option.icon
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex items-center justify-center gap-2 rounded-[10px] px-3 py-3.5 text-sm font-bold transition sm:py-4',
              selected
                ? 'bg-idl-ink text-idl-paper shadow-[0_2px_8px_rgba(12,12,13,0.25)]'
                : 'text-idl-muted hover:bg-idl-tech-chip hover:text-idl-graphite',
              disabled && 'pointer-events-none opacity-60',
            )}
          >
            <Icon className="size-5 shrink-0" />
            <span>{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}

type Props = {
  value: CheckoutCustomerTypeValue
  onChange: (value: CheckoutCustomerTypeValue) => void
  disabled?: boolean
  className?: string
  variant?: 'cards' | 'tabs'
}

export function CheckoutCustomerTypeCards({
  value,
  onChange,
  disabled,
  className,
  variant = 'cards',
}: Props) {
  const { t } = useI18n()

  if (variant === 'tabs') {
    return (
      <CheckoutChoiceTabs
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={className}
        ariaLabel={t('checkout.customerType.hint')}
        options={CUSTOMER_TYPES.map((option) => ({
          value: option,
          label: t(`checkout.customerType.${option}.title`),
          icon: option === 'retail' ? PersonIcon : BuildingIcon,
        }))}
      />
    )
  }

  return (
    <div
      className={cn('grid gap-3 sm:grid-cols-2 sm:gap-4', className)}
      role="radiogroup"
      aria-label={t('checkout.customerType.hint')}
    >
      {CUSTOMER_TYPES.map((option) => {
        const selected = value === option
        const Icon = option === 'retail' ? PersonIcon : BuildingIcon

        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(option)}
            className={cn(
              'flex w-full flex-col items-start gap-3 rounded-2xl border-[1.5px] p-5 text-left transition sm:p-6',
              selected
                ? 'border-idl-ink bg-idl-ink text-idl-paper shadow-[0_2px_10px_rgba(12,12,13,0.2)]'
                : 'border-idl-tech-border bg-idl-tech-panel text-idl-graphite hover:border-idl-border-strong',
              disabled && 'pointer-events-none opacity-60',
            )}
          >
            <span
              className={cn(
                'flex size-12 shrink-0 items-center justify-center rounded-xl sm:size-14',
                selected
                  ? 'bg-idl-paper/12 text-idl-paper ring-1 ring-idl-paper/20'
                  : 'bg-idl-tech-chip text-idl-ink-soft shadow-sm ring-1 ring-idl-tech-border',
              )}
            >
              <Icon className="size-6 sm:size-7" />
            </span>
            <span
              className={cn(
                'text-base font-extrabold tracking-[-0.01em] sm:text-[17px]',
                selected ? 'text-idl-paper' : 'text-idl-graphite',
              )}
            >
              {t(`checkout.customerType.${option}.title`)}
            </span>
          </button>
        )
      })}
    </div>
  )
}
