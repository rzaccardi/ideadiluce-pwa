'use client'

import type { FreeShippingHintDTO } from '@/types/dto'
import { formatMoney } from '@/lib/format'
import { useI18n } from '@/hooks/use-i18n'
import { CART_CARD_SURFACE } from '@/components/cart/cart-surfaces'
import { cn } from '@/utils/cn'

type Props = {
  hint: FreeShippingHintDTO | null | undefined
  currencyCode?: string
  className?: string
}

function TruckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="#1f9d57"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="1" y="6" width="15" height="12" rx="1.5" />
      <path d="M16 9 h4 l3 3 v6 h-7" />
      <circle cx="6" cy="18" r="2" />
      <circle cx="19" cy="18" r="2" />
    </svg>
  )
}

export function CartFreeShippingBanner({ hint, currencyCode = 'EUR', className }: Props) {
  const { t, tParams } = useI18n()

  if (!hint) return null

  const progress = hint.eligible
    ? 100
    : Math.min(100, Math.round(((hint.thresholdCents - hint.remainingCents) / hint.thresholdCents) * 100))

  const message = hint.eligible
    ? tParams('cart.freeShipping.unlockedDetail', {
        amount: formatMoney(hint.thresholdCents, currencyCode),
      })
    : tParams('cart.freeShipping.remaining', {
        amount: formatMoney(hint.remainingCents, currencyCode),
      })

  return (
    <div
      className={cn(CART_CARD_SURFACE, 'px-[22px] py-[18px]', className)}
    >
      <div className="mb-2.5 flex items-start gap-2 text-[13.5px] leading-snug text-idl-graphite">
        <span className="mt-px shrink-0">
          <TruckIcon />
        </span>
        <p className="min-w-0 flex-1">
          <strong className="block">{t('cart.freeShipping.unlocked')}</strong>
          <span className="mt-0.5 block">{message}</span>
        </p>
      </div>
      <div
        className="h-[7px] overflow-hidden rounded-full bg-idl-tech-chip"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t('cart.freeShipping.progress')}
      >
        <div
          className="h-full rounded-full bg-[#1f9d57] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
