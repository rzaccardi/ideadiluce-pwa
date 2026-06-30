'use client'

import { CartPageBody, CartPageShell } from '@/components/cart/CartPageShell'
import { CART_CARD_SURFACE, CART_CARD_SURFACE_OVERFLOW } from '@/components/cart/cart-surfaces'
import { SectionContainer } from '@/components/site/primitives'
import { Skeleton } from '@/components/skeleton-primitive'
import { useI18n } from '@/hooks/use-i18n'
import { cn } from '@/utils/cn'

function CartLineSkeleton() {
  return (
    <li className="flex flex-col gap-4 border-b border-idl-tech-border/80 p-5 last:border-b-0 sm:flex-row sm:p-[22px]">
      <div className="flex min-w-0 flex-1 gap-4">
        <Skeleton className="size-[84px] shrink-0 rounded-[9px]" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-5 w-3/4" />
          <div className="flex gap-1.5">
            <Skeleton className="h-5 w-10 rounded" />
            <Skeleton className="h-5 w-10 rounded" />
          </div>
          <Skeleton className="h-3.5 w-40" />
        </div>
      </div>
      <div className="flex items-center justify-between gap-4 sm:w-[168px] sm:flex-col sm:items-end">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-[34px] w-[118px] rounded-lg" />
      </div>
    </li>
  )
}

function CartSummaryAsideSkeleton() {
  return (
    <aside className="sticky top-6 flex min-w-0 flex-col gap-4">
      <div className={cn(CART_CARD_SURFACE, 'p-[22px]')}>
        <Skeleton className="h-5 w-28" />
        <div className="mt-4 space-y-3">
          <div className="flex justify-between gap-6">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex justify-between gap-6">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-14" />
          </div>
          <div className="flex justify-between gap-6 border-t border-idl-tech-border pt-4">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
        <Skeleton className="mt-6 h-12 w-full rounded-[10px]" />
        <Skeleton className="mt-3 h-10 w-full rounded-lg" />
        <Skeleton className="mx-auto mt-3 h-3 w-36" />
        <div className="mt-3.5 flex flex-wrap justify-center gap-1.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-12 rounded" />
          ))}
        </div>
      </div>

      <div className="rounded-[14px] border border-idl-promo-border bg-idl-promo-bg p-5">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-2 h-4 w-full" />
        <Skeleton className="mt-1 h-4 w-5/6" />
        <Skeleton className="mt-3.5 h-10 w-44 rounded-lg" />
      </div>
    </aside>
  )
}

export function CartPageSkeleton() {
  const { t } = useI18n()

  return (
    <CartPageShell>
      <section className="border-b border-idl-tech-border bg-idl-tech-panel">
        <SectionContainer className="py-6 sm:py-7">
          <Skeleton className="mb-3 h-3 w-48" />
          <Skeleton className="h-9 w-64 max-w-full" />
        </SectionContainer>
      </section>

      <CartPageBody>
        <SectionContainer className="py-6 sm:py-8 lg:py-10">
          <div
            className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_372px] lg:gap-8"
            role="status"
            aria-label={t('skeleton.loadingCart')}
          >
            <div className="flex min-w-0 flex-col gap-[18px]">
              <div className={cn(CART_CARD_SURFACE, 'px-[22px] py-[18px]')}>
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="mt-2.5 h-[7px] w-full rounded-full" />
              </div>

              <ul className={CART_CARD_SURFACE_OVERFLOW}>
                {Array.from({ length: 3 }).map((_, index) => (
                  <CartLineSkeleton key={index} />
                ))}
              </ul>

              <div className="flex justify-end">
                <Skeleton className="h-4 w-28" />
              </div>
            </div>

            <CartSummaryAsideSkeleton />
          </div>
        </SectionContainer>
      </CartPageBody>
    </CartPageShell>
  )
}
