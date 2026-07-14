'use client'

import { useI18n } from '@/hooks/use-i18n'
import { cn } from '@/utils/cn'

const CUSTOMER_TYPES = ['retail', 'business'] as const
export type CheckoutCustomerTypeValue = (typeof CUSTOMER_TYPES)[number]

function PersonIcon({ className }: { className?: string }) {
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

function BuildingIcon({ className }: { className?: string }) {
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
      <div
        className={cn('grid grid-cols-2 gap-2 rounded-xl border border-idl-tech-border bg-idl-tech-panel p-1.5', className)}
        role="tablist"
        aria-label={t('checkout.customerType.hint')}
      >
        {CUSTOMER_TYPES.map((option) => {
          const selected = value === option
          const Icon = option === 'retail' ? PersonIcon : BuildingIcon
          return (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={selected}
              disabled={disabled}
              onClick={() => onChange(option)}
              className={cn(
                'flex items-center justify-center gap-2 rounded-[10px] px-3 py-3.5 text-sm font-bold transition sm:py-4',
                selected
                  ? 'bg-[#c9a24b] text-black shadow-[0_2px_8px_rgba(201,162,75,0.35)]'
                  : 'text-idl-muted hover:bg-idl-tech-panel/60 hover:text-idl-graphite',
                disabled && 'pointer-events-none opacity-60',
              )}
            >
              <Icon className="size-5 shrink-0" />
              <span>{t(`checkout.customerType.${option}.title`)}</span>
            </button>
          )
        })}
      </div>
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
                ? 'border-[#14161b] bg-[#f8f8f6] shadow-[0_0_0_3px_rgba(201, 162, 75,0.2)]'
                : 'border-[#e7eaee] bg-idl-tech-panel hover:border-[#c0c5cc] hover:bg-idl-tech-panel',
              disabled && 'pointer-events-none opacity-60',
            )}
          >
            <span
              className={cn(
                'flex size-12 shrink-0 items-center justify-center rounded-xl sm:size-14',
                selected ? 'bg-[#14161b] text-white' : 'bg-idl-tech-panel text-[#9a7b33] shadow-sm ring-1 ring-[#e7eaee]',
              )}
            >
              <Icon className="size-6 sm:size-7" />
            </span>
            <span className="text-base font-extrabold tracking-[-0.01em] text-idl-graphite sm:text-[17px]">
              {t(`checkout.customerType.${option}.title`)}
            </span>
          </button>
        )
      })}
    </div>
  )
}
