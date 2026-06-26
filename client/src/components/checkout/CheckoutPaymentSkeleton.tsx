'use client'

import type { CSSProperties } from 'react'
import { StripeFieldGroup } from '@/components/checkout/stripe-ui/StripeFields'
import { cn } from '@/utils/cn'
import { useI18n } from '@/hooks/use-i18n'

function ShimmerBlock({ className, delayMs = 0 }: { className?: string; delayMs?: number }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'checkout-payment-shimmer relative block overflow-hidden rounded-md bg-zinc-200/90',
        className,
      )}
      style={{ ['--shimmer-delay' as string]: `${delayMs}ms` } as CSSProperties}
    />
  )
}

/** Placeholder animato mentre si prepara Stripe Elements. */
export function CheckoutPaymentSkeleton() {
  const { t } = useI18n()
  return (
    <div className="space-y-6" role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">{t('checkout.payment.loadingModule')}</span>

      <div className="grid grid-cols-2 gap-3">
        <ShimmerBlock className="h-11" />
        <ShimmerBlock className="h-11" delayMs={120} />
      </div>

      <div className="relative py-1">
        <div className="border-t border-zinc-200" />
        <ShimmerBlock className="absolute left-1/2 top-1/2 h-4 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full" delayMs={60} />
      </div>

      <div className="flex gap-2">
        <ShimmerBlock className="h-9 w-20 rounded-md" delayMs={80} />
        <ShimmerBlock className="h-9 w-16 rounded-md opacity-70" delayMs={160} />
      </div>

      <div className="space-y-3">
        <ShimmerBlock className="h-3.5 w-24" delayMs={40} />
        <StripeFieldGroup>
          <ShimmerBlock className="h-[46px] rounded-none" />
          <div className="grid grid-cols-2">
            <ShimmerBlock className="h-[46px] rounded-none" delayMs={100} />
            <ShimmerBlock
              className="h-[46px] rounded-none border-l border-zinc-200"
              delayMs={180}
            />
          </div>
        </StripeFieldGroup>
      </div>
    </div>
  )
}
