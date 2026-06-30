'use client'

import { Skeleton } from '@/components/skeleton-primitive'

export function AccountWishlistSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <article
          key={i}
          className="overflow-hidden rounded-lg border border-idl-tech-border bg-white dark:bg-idl-tech-panel"
        >
          <Skeleton className="aspect-square w-full rounded-none" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
        </article>
      ))}
    </div>
  )
}
