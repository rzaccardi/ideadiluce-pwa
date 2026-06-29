'use client'

import { AUTH_FORM_CONTAINER_CLASS, SITE_CONTENT_CLASS } from '@/components/Container'
import { checkoutMainClass, checkoutShellClass } from '@/components/checkout/stripe-ui/constants'
import { useI18n } from '@/hooks/use-i18n'
import type { MessageKey } from '@/i18n/messages'
import { PageFlexBody, PageFlexShell } from '@/components/layout/PageFlexShell'
import { SectionContainer } from '@/components/site/primitives'
import { cn } from '@/utils/cn'

type SkeletonProps = {
  className?: string
}

function SrOnlyStatus({ messageKey, as: Tag = 'span' }: { messageKey: MessageKey; as?: 'span' | 'li' }) {
  const { t } = useI18n()
  return <Tag className="sr-only">{t(messageKey)}</Tag>
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={cn('block animate-pulse rounded-md bg-idl-cream', className)}
    />
  )
}

export function ProductCardSkeleton({ className }: SkeletonProps) {
  return (
    <article
      className={cn(
        'flex h-full flex-col overflow-hidden rounded-xl border border-idl-border bg-idl-tech-panel',
        className,
      )}
    >
      <Skeleton className="aspect-[4/3] shrink-0 rounded-none" />
      <div className="flex flex-1 flex-col p-4">
        <div className="flex-1 space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
        <Skeleton className="mt-4 h-4 w-24 shrink-0" />
      </div>
    </article>
  )
}

export function ProductGridSkeleton({
  count = 6,
  className,
}: SkeletonProps & { count?: number }) {
  return (
    <ul className={cn('grid gap-6 sm:grid-cols-2 lg:grid-cols-3', className)} role="status">
      <SrOnlyStatus messageKey="skeleton.loadingProducts" as="li" />
      {Array.from({ length: count }).map((_, index) => (
        <li key={index} className="h-full">
          <ProductCardSkeleton />
        </li>
      ))}
    </ul>
  )
}

export function CartLineSkeleton({ variant = 'default' }: { variant?: 'default' | 'page' }) {
  if (variant === 'page') {
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

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-idl-border bg-idl-tech-panel p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-2">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-24 rounded-lg" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    </li>
  )
}

export function CartItemsSkeleton({
  count = 3,
  className,
  variant = 'default',
}: SkeletonProps & { count?: number; variant?: 'default' | 'page' }) {
  if (variant === 'page') {
    return (
      <div className={cn('flex flex-col gap-[18px]', className)} role="status">
        <SrOnlyStatus messageKey="skeleton.loadingCart" />
        <Skeleton className="h-[74px] rounded-[14px]" />
        <ul className="overflow-hidden rounded-[14px] border border-idl-tech-border bg-idl-tech-panel">
          {Array.from({ length: count }).map((_, index) => (
            <CartLineSkeleton key={index} variant="page" />
          ))}
        </ul>
      </div>
    )
  }

  return (
    <ul className={cn('space-y-3', className)} role="status">
      <SrOnlyStatus messageKey="skeleton.loadingCart" as="li" />
      {Array.from({ length: count }).map((_, index) => (
        <CartLineSkeleton key={index} />
      ))}
    </ul>
  )
}

export function CartSummarySkeleton({
  className,
  showCheckoutCta,
  variant = 'default',
}: SkeletonProps & { showCheckoutCta?: boolean; variant?: 'default' | 'page' }) {
  const { t } = useI18n()
  return (
    <aside
      className={cn(
        variant === 'page'
          ? 'sticky top-6 rounded-[14px] border border-idl-tech-border bg-idl-tech-panel p-[22px]'
          : 'h-fit rounded-xl border border-idl-border bg-idl-tech-panel p-6 shadow-sm shadow-idl-ink/5',
        className,
      )}
      role="status"
    >
      <span className="sr-only">{t('skeleton.loadingCartSummary')}</span>
      <Skeleton className="h-4 w-20" />
      <div className="mt-4 space-y-3">
        <div className="flex justify-between gap-6">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex justify-between gap-6">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-14" />
        </div>
        <div className="flex justify-between gap-6 border-t border-idl-border/60 pt-4">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
        </div>
      </div>
      {showCheckoutCta ? <Skeleton className="mt-6 h-10 w-full rounded-lg" /> : null}
    </aside>
  )
}

export function ProductDetailSkeleton() {
  const { t } = useI18n()
  return (
    <PageFlexShell tone="white">
      <div className="space-y-12" role="status">
        <span className="sr-only">{t('skeleton.loadingProduct')}</span>
        <SectionContainer className="py-6 sm:py-8">
          <div className="grid min-w-0 gap-8 sm:gap-10 lg:grid-cols-2">
            <Skeleton className="aspect-square rounded-xl" />
            <div className="min-w-0 text-left">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="mt-4 h-8 w-32" />
              <Skeleton className="mt-3 h-4 w-24" />
              <Skeleton className="mt-3 h-4 w-28" />
              <div className="mt-6 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <div className="mt-6 max-w-md space-y-4">
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-40 rounded-lg" />
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Skeleton className="h-10 w-40 rounded-lg" />
                <Skeleton className="h-10 w-28 rounded-lg" />
              </div>
            </div>
          </div>
        </SectionContainer>
        <PageFlexBody tone="white">
          <SectionContainer className="space-y-8 pb-10">
            <Skeleton className="h-4 w-full max-w-3xl" />
            <Skeleton className="h-4 w-full max-w-3xl" />
            <Skeleton className="h-4 w-4/5 max-w-3xl" />
            <Skeleton className="h-48 w-full max-w-2xl rounded-lg" />
          </SectionContainer>
        </PageFlexBody>
      </div>
    </PageFlexShell>
  )
}

export function CheckoutCartSectionSkeleton() {
  return (
    <section className="rounded-xl border border-idl-border bg-idl-tech-panel p-6 shadow-sm shadow-idl-ink/5">
      <Skeleton className="h-5 w-44" />
      <Skeleton className="mt-2 h-4 w-2/3" />
      <Skeleton className="mt-5 h-4 w-56" />
      <div className="mt-3 divide-y divide-idl-border bg-idl-path-tech rounded-lg border border-idl-border">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex items-center justify-between px-3 py-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </section>
  )
}

export function CheckoutFormSkeleton() {
  return (
    <section className="rounded-xl border border-idl-border bg-idl-tech-panel p-6 shadow-sm shadow-idl-ink/5">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="mt-2 h-4 w-3/4" />
      <div className="mt-5 space-y-6">
        <Skeleton className="h-16 w-full rounded-lg" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-5 w-64" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </section>
  )
}

export function CheckoutPageSkeleton() {
  const { t } = useI18n()
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_280px]" role="status">
      <span className="sr-only">{t('skeleton.loadingCheckout')}</span>
      <div className="space-y-8">
        <CheckoutCartSectionSkeleton />
        <CheckoutFormSkeleton />
        <section className="rounded-xl border border-idl-border bg-idl-tech-panel p-6 shadow-sm shadow-idl-ink/5">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="mt-2 h-4 w-2/3" />
          <Skeleton className="mt-5 h-10 w-48 rounded-lg" />
        </section>
      </div>
      <aside className="space-y-4">
        <CartSummarySkeleton />
        <Skeleton className="h-8 w-full" />
      </aside>
    </div>
  )
}

export function PageHeaderSkeleton({ withActions }: { withActions?: boolean }) {
  const { t } = useI18n()
  return (
    <div
      className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
      role="status"
      aria-label={t('skeleton.loadingPageHeader')}
    >
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 sm:w-64" />
        <Skeleton className="h-4 w-full max-w-md" />
        <Skeleton className="h-4 w-2/3 max-w-sm" />
      </div>
      {withActions ? (
        <div className="flex shrink-0 gap-2">
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      ) : null}
    </div>
  )
}

export function AuthFormSkeleton({ fieldCount = 2 }: { fieldCount?: number }) {
  const { t } = useI18n()
  return (
    <div className="space-y-4" role="status" aria-label={t('skeleton.loadingForm')}>
      {Array.from({ length: fieldCount }).map((_, index) => (
        <Skeleton key={index} className="h-16 w-full rounded-lg" />
      ))}
      <Skeleton className="h-10 w-full rounded-lg" />
      <Skeleton className="mt-2 h-4 w-40" />
    </div>
  )
}

export function PaymentResultContentSkeleton() {
  const { t } = useI18n()
  return (
    <div
      className="w-full space-y-4 overflow-hidden rounded-2xl bg-idl-tech-panel p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:p-8"
      role="status"
      aria-label={t('skeleton.loadingPaymentResult')}
    >
      <div className="flex justify-center">
        <Skeleton className="size-16 rounded-full" />
      </div>
      <Skeleton className="mx-auto h-3 w-28" />
      <Skeleton className="mx-auto h-8 w-4/5" />
      <Skeleton className="mx-auto h-4 w-full max-w-sm" />
      <Skeleton className="mx-auto h-4 w-5/6 max-w-sm" />
      <div className="space-y-3 border-t border-idl-border/60 pt-5">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex justify-between gap-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
      <div className="grid gap-3 pt-2 sm:grid-cols-2">
        <Skeleton className="h-12 w-full rounded-md" />
        <Skeleton className="h-12 w-full rounded-md" />
      </div>
    </div>
  )
}

export function CatalogFiltersSkeleton() {
  const { t } = useI18n()
  return (
    <div
      className="mb-8 space-y-4 rounded-xl border border-idl-border bg-idl-tech-panel p-4 sm:p-6"
      role="status"
      aria-label={t('skeleton.loadingCatalogFilters')}
    >
      <Skeleton className="h-10 w-full rounded-lg" />
      <Skeleton className="h-4 w-3/4" />
      <div className="flex flex-wrap gap-2 border-t border-idl-border/60 pt-4">
        <Skeleton className="h-9 w-24 rounded-lg" />
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>
    </div>
  )
}

export function ContentPageSkeleton() {
  const { t } = useI18n()
  return (
    <div className="space-y-8" role="status" aria-label={t('skeleton.loadingPageHeader')}>
      <div className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/5" />
      </div>
      <Skeleton className="h-56 w-full rounded-xl" />
    </div>
  )
}

export function EditorialPageSkeleton() {
  const { t } = useI18n()
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label={t('skeleton.loadingProducts')}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-3 rounded-xl border border-idl-border bg-idl-tech-panel p-5">
          <Skeleton className="aspect-[4/3] w-full rounded-lg" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  )
}

export function ProfessionistiPageSkeleton() {
  const { t } = useI18n()
  return (
    <PageFlexShell tone="white">
      <PageFlexBody tone="white">
        <SectionContainer className="space-y-10 py-8 sm:py-10">
          <div className="grid gap-8 lg:grid-cols-2" role="status" aria-label={t('skeleton.loadingForm')}>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
            <Skeleton className="min-h-80 w-full rounded-xl" />
          </div>
        </SectionContainer>
      </PageFlexBody>
    </PageFlexShell>
  )
}

export function ImpersonatePageSkeleton() {
  const { t } = useI18n()
  return (
    <PageFlexShell tone="paper">
      <PageFlexBody tone="paper" className="flex items-center justify-center py-16">
        <div className={cn(AUTH_FORM_CONTAINER_CLASS, 'text-center')} role="status" aria-label={t('impersonate.loading')}>
          <Skeleton className="mx-auto size-12 rounded-full" />
          <Skeleton className="mx-auto mt-6 h-5 w-48" />
          <Skeleton className="mx-auto mt-3 h-4 w-64" />
        </div>
      </PageFlexBody>
    </PageFlexShell>
  )
}

export function CategoryPageSkeleton() {
  return <ProductGridSkeleton count={6} />
}

export function HomePageSkeleton() {
  const { t } = useI18n()
  return (
    <PageFlexShell tone="paper">
      <div className="grid border-b border-idl-border bg-idl-tech-panel lg:grid-cols-2" role="status" aria-label={t('skeleton.loadingPageHeader')}>
        <Skeleton className="min-h-[320px] rounded-none sm:min-h-[380px] lg:min-h-[420px]" />
        <Skeleton className="min-h-[320px] rounded-none sm:min-h-[380px] lg:min-h-[420px]" />
      </div>
      <PageFlexBody tone="paper">
        <div className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
          <Skeleton className="mx-auto h-12 w-full max-w-2xl rounded-lg" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-4 rounded-xl border border-idl-border p-5">
                <Skeleton className="h-6 w-40" />
                <ProductGridSkeleton count={2} className="sm:grid-cols-2" />
              </div>
            ))}
          </div>
        </div>
      </PageFlexBody>
    </PageFlexShell>
  )
}

/** Griglia hub editoriali: brand, ambienti, guide. */
export function StaticHubSectionSkeleton({ count = 6 }: { count?: number }) {
  const { t } = useI18n()
  return (
    <div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      role="status"
      aria-label={t('skeleton.loadingPageHeader')}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3 rounded-xl border border-idl-border bg-idl-tech-panel p-4">
          <Skeleton className="aspect-[4/3] w-full rounded-lg" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  )
}

export function CategoryLandingCatalogSkeleton({ variant = 'design' }: { variant?: 'design' | 'technical' }) {
  const isDesign = variant === 'design'
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[248px_1fr]">
        <Skeleton className="hidden h-80 rounded-lg lg:block" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-full rounded-lg" />
          <div
            className={cn(
              'grid gap-3 sm:gap-4',
              isDesign ? 'sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-2 xl:grid-cols-3',
            )}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton
                key={i}
                className={cn('rounded-lg', isDesign ? 'h-72 sm:h-80' : 'h-64 sm:h-72')}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function OrderDetailSkeleton() {
  const { t } = useI18n()
  return (
    <div className="space-y-4" role="status" aria-label={t('orders.detail.loading')}>
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-7 w-24 rounded-full" />
        <Skeleton className="h-7 w-28 rounded-full" />
      </div>
      <div className="space-y-3 rounded-xl border border-idl-border bg-idl-tech-panel p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex justify-between gap-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-36" />
          </div>
        ))}
      </div>
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  )
}

function DarkSkeleton({ className }: SkeletonProps) {
  return <span aria-hidden="true" className={cn('block animate-pulse rounded-md bg-idl-cream', className)} />
}

export function CheckoutStripeBootstrapSkeleton() {
  const { t } = useI18n()
  return (
    <div
      className={checkoutShellClass}
      role="status"
      aria-label={t('skeleton.loadingCheckout')}
    >
      <aside className="checkout-summary-dark hidden min-w-0 lg:col-start-1 lg:row-start-1 lg:block lg:min-h-dvh lg:w-auto lg:max-w-none lg:shrink">
        <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-10 xl:px-12">
          <DarkSkeleton className="h-5 w-32" />
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="flex gap-4">
              <DarkSkeleton className="size-16 shrink-0 rounded-md" />
              <div className="flex-1 space-y-2">
                <DarkSkeleton className="h-4 w-full" />
                <DarkSkeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
          <div className="space-y-3 border-t border-white/10 pt-6">
            <div className="flex justify-between">
              <DarkSkeleton className="h-4 w-24" />
              <DarkSkeleton className="h-4 w-16" />
            </div>
            <div className="flex justify-between">
              <DarkSkeleton className="h-5 w-16" />
              <DarkSkeleton className="h-5 w-20" />
            </div>
          </div>
        </div>
      </aside>
      <main className={checkoutMainClass}>
        <div className="mx-auto w-full max-w-[540px] flex-1 space-y-8 px-4 py-5 sm:px-5 sm:py-6 md:px-6 lg:py-10 xl:px-12">
          <div className="flex gap-2 lg:hidden">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-2 flex-1 rounded-full" />
            ))}
          </div>
          <div className="space-y-3">
            <Skeleton className="h-7 w-48 sm:h-8" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-5 w-40" />
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          </div>
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
      </main>
    </div>
  )
}

export function AccountBootstrapSkeleton({ children }: { children: React.ReactNode }) {
  const { t } = useI18n()
  return (
    <div className="bg-idl-tech-panel" role="status" aria-label={t('skeleton.loadingAccount')}>
      <div className="border-b border-idl-tech-border bg-idl-tech-panel">
        <div className={cn(SITE_CONTENT_CLASS, 'flex items-center gap-4 py-8')}>
          <Skeleton className="size-[58px] rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
      </div>
      <div className={cn(SITE_CONTENT_CLASS, 'py-8')}>
        <div className="grid gap-7 lg:grid-cols-[236px_1fr]">
          <Skeleton className="h-80 rounded-[14px]" />
          <div className="space-y-4">{children}</div>
        </div>
      </div>
    </div>
  )
}

export function SiteChromeSkeleton({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-idl-paper">
      <header className="border-b border-idl-border bg-idl-tech-panel">
        <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <Skeleton className="h-6 w-32" />
            <div className="flex flex-wrap gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-4 w-16" />
              ))}
            </div>
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
        </div>
      </header>
      <main className="flex-1 py-8">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">{children}</div>
      </main>
      <footer className="border-t border-idl-border bg-idl-tech-panel py-8">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-4 w-48" />
        </div>
      </footer>
    </div>
  )
}

export function ListSkeleton({
  count = 4,
  className,
}: SkeletonProps & { count?: number }) {
  return (
    <ul
      className={cn('divide-y divide-idl-border rounded-xl border border-idl-border bg-idl-tech-panel', className)}
      role="status"
    >
      <SrOnlyStatus messageKey="skeleton.loadingList" as="li" />
      {Array.from({ length: count }).map((_, index) => (
        <li key={index} className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="space-y-2">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-5 w-20" />
        </li>
      ))}
    </ul>
  )
}
