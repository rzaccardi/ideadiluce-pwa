'use client'

import { useI18n } from '@/hooks/use-i18n'
import { cn } from '@/utils/cn'

type Props = {
  onClick: () => void
  disabled?: boolean
  loading?: boolean
  verified?: boolean
  className?: string
}

function CheckIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M4.5 9.25 7.5 12.25 13.5 5.75"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Pulsantino manuale per verifica P.IVA / codice fiscale. */
export function TaxVerifyButton({ onClick, disabled, loading, verified, className }: Props) {
  const { t } = useI18n()
  const showVerified = verified && !loading

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading || showVerified}
      aria-label={
        showVerified ? t('checkout.billing.fiscalCodeValid') : t('checkout.billing.verify')
      }
      className={cn(
        'flex shrink-0 items-center justify-center self-stretch rounded-[11px] border px-3 text-[13px] font-bold transition',
        showVerified
          ? 'min-w-[46px] border-emerald-600 bg-emerald-50 text-emerald-700'
          : 'border-[#e2e6eb] bg-[#f4f5f7] text-[#14161b] hover:border-[#14161b] hover:bg-white',
        'disabled:cursor-not-allowed',
        !showVerified && 'disabled:opacity-50',
        className,
      )}
    >
      {loading ? (
        t('checkout.billing.verifying')
      ) : showVerified ? (
        <CheckIcon />
      ) : (
        t('checkout.billing.verify')
      )}
    </button>
  )
}
