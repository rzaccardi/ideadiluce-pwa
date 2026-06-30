'use client'

import { Skeleton } from '@/components/skeleton-primitive'
import { useI18n } from '@/hooks/use-i18n'

export function WishlistItemCardSkeleton() {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-idl-border bg-idl-tech-panel">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="flex flex-1 flex-col p-4">
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="mt-2 h-5 w-20" />
        <div className="mt-4 flex flex-wrap gap-2">
          <Skeleton className="h-10 flex-1 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
      </div>
    </article>
  )
}

export function WishlistPageSkeleton({ count = 3 }: { count?: number }) {
  const { t } = useI18n()

  return (
    <div className="space-y-8" role="status" aria-label={t('skeleton.loadingProducts')}>
      <div className="mb-8 space-y-2">
        <Skeleton className="h-8 w-48 sm:w-64" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <Skeleton className="h-10 w-44 rounded-lg" />
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }).map((_, i) => (
          <li key={i} className="h-full">
            <WishlistItemCardSkeleton />
          </li>
        ))}
      </ul>
    </div>
  )
}
