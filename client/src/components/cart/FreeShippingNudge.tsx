'use client'

import type { FreeShippingHintDTO } from '@/types/dto'
import { formatMoney } from '@/lib/format'
import { useI18n } from '@/hooks/use-i18n'
import { cn } from '@/utils/cn'

type Props = {
  hint: FreeShippingHintDTO | null | undefined
  currencyCode?: string
  className?: string
}

export function FreeShippingNudge({ hint, currencyCode = 'EUR', className }: Props) {
  const { t, tParams } = useI18n()

  if (!hint) return null

  const progress = hint.eligible
    ? 100
    : Math.min(100, Math.round((hint.thresholdCents - hint.remainingCents) / hint.thresholdCents * 100))

  return (
    <div
      className={cn(
        'rounded-lg border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-900',
        className,
      )}
    >
      <p className="font-medium">
        {hint.eligible
          ? t('cart.freeShipping.unlocked')
          : tParams('cart.freeShipping.remaining', {
              amount: formatMoney(hint.remainingCents, currencyCode),
            })}
      </p>
      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-emerald-100"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t('cart.freeShipping.progress')}
      >
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
