'use client'

import { cn } from '@/utils/cn'
import { useI18n } from '@/hooks/use-i18n'
import {
  CHECKOUT_STORE_NAME,
  checkoutSummaryAsideClass,
  checkoutSummaryInnerClass,
  checkoutTitleTypographyClass,
} from './constants'
import { CheckoutSummaryFooter, CheckoutSummaryHeader } from './CheckoutOrderSummary'

function DarkSkeleton({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('block animate-pulse rounded-md bg-white/10', className)}
    />
  )
}

/** Sidebar checkout scura: header, trust e footer statici; righe e totali in skeleton. */
export function CheckoutSummarySkeleton() {
  const { tParams } = useI18n()

  return (
    <aside className={cn(checkoutSummaryAsideClass, 'lg:flex')}>
      <div className={checkoutSummaryInnerClass}>
        <CheckoutSummaryHeader theme="dark" />
        <p className="mt-8 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#b0b0b4]">
          {tParams('checkout.payStore', { store: CHECKOUT_STORE_NAME })}
        </p>
        <DarkSkeleton className={cn(checkoutTitleTypographyClass, 'mt-1 h-8 w-28 sm:h-9')} />

        <div className="mt-8 flex-1 space-y-5">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="flex gap-3 sm:gap-3.5">
              <DarkSkeleton className="size-16 shrink-0 rounded-[9px]" />
              <div className="min-w-0 flex-1 space-y-2 pt-0.5">
                <DarkSkeleton className="h-4 w-full" />
                <DarkSkeleton className="h-3 w-20" />
              </div>
              <DarkSkeleton className="h-4 w-14 shrink-0" />
            </div>
          ))}

          <div className="space-y-2.5 border-t border-white/10 pt-5">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex justify-between gap-4">
                <DarkSkeleton className="h-4 w-24" />
                <DarkSkeleton className="h-4 w-16" />
              </div>
            ))}
          </div>

          <div className="flex justify-between border-t border-white/10 pt-4">
            <DarkSkeleton className="h-5 w-14" />
            <DarkSkeleton className="h-5 w-20" />
          </div>
        </div>

        <CheckoutSummaryFooter theme="dark" />
      </div>
    </aside>
  )
}
