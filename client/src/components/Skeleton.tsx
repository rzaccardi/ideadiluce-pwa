import { cn } from '@/utils/cn'

type SkeletonProps = {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={cn('block animate-pulse rounded-md bg-zinc-200', className)}
    />
  )
}

export function ProductCardSkeleton({ className }: SkeletonProps) {
  return (
    <article className={cn('overflow-hidden rounded-xl border border-zinc-200 bg-white', className)}>
      <Skeleton className="aspect-[4/3] rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-5 w-3/4" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <Skeleton className="h-4 w-24" />
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
      <li className="sr-only">Caricamento prodotti...</li>
      {Array.from({ length: count }).map((_, index) => (
        <li key={index}>
          <ProductCardSkeleton />
        </li>
      ))}
    </ul>
  )
}

export function CartLineSkeleton() {
  return (
    <li className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
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

export function CartItemsSkeleton({ count = 3, className }: SkeletonProps & { count?: number }) {
  return (
    <ul className={cn('space-y-3', className)} role="status">
      <li className="sr-only">Caricamento carrello...</li>
      {Array.from({ length: count }).map((_, index) => (
        <CartLineSkeleton key={index} />
      ))}
    </ul>
  )
}

export function CartSummarySkeleton({
  className,
  showCheckoutCta,
}: SkeletonProps & { showCheckoutCta?: boolean }) {
  return (
    <aside
      className={cn(
        'h-fit rounded-xl border border-zinc-200 bg-white p-6 shadow-sm shadow-zinc-950/5',
        className,
      )}
      role="status"
    >
      <span className="sr-only">Caricamento riepilogo carrello...</span>
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
        <div className="flex justify-between gap-6 border-t border-zinc-100 pt-4">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
        </div>
      </div>
      {showCheckoutCta ? <Skeleton className="mt-6 h-10 w-full rounded-lg" /> : null}
    </aside>
  )
}

export function ProductDetailSkeleton() {
  return (
    <div className="space-y-12" role="status">
      <span className="sr-only">Caricamento prodotto...</span>
      <div className="grid gap-10 md:grid-cols-2">
        <Skeleton className="aspect-square rounded-xl" />
        <div className="text-left">
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
    </div>
  )
}

export function CheckoutCartSectionSkeleton() {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm shadow-zinc-950/5">
      <Skeleton className="h-5 w-44" />
      <Skeleton className="mt-2 h-4 w-2/3" />
      <Skeleton className="mt-5 h-4 w-56" />
      <div className="mt-3 divide-y divide-zinc-100 rounded-lg border border-zinc-200 bg-zinc-50/50">
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
    <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm shadow-zinc-950/5">
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
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_280px]" role="status">
      <span className="sr-only">Caricamento checkout...</span>
      <div className="space-y-8">
        <CheckoutCartSectionSkeleton />
        <CheckoutFormSkeleton />
        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm shadow-zinc-950/5">
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

export function ListSkeleton({
  count = 4,
  className,
}: SkeletonProps & { count?: number }) {
  return (
    <ul
      className={cn('divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white', className)}
      role="status"
    >
      <li className="sr-only">Caricamento elenco...</li>
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
