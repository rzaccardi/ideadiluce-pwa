'use client'

import { cn } from '@/utils/cn'
import { Skeleton } from '@/components/skeleton-primitive'
import { useI18n } from '@/hooks/use-i18n'

function PageHeaderBlock() {
  return (
    <div className="mb-8 flex flex-col gap-3">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 sm:w-64" />
        <Skeleton className="h-4 w-full max-w-md" />
        <Skeleton className="h-4 w-2/3 max-w-sm" />
      </div>
    </div>
  )
}

export function GuideCardSkeleton({ variant = 'editorial' }: { variant?: 'home' | 'editorial' }) {
  const minHeight = variant === 'home' ? 'min-h-[210px]' : 'min-h-[180px]'

  return (
    <div
      className={cn(
        'flex flex-col rounded-lg border border-idl-path-design-border bg-white p-5 dark:bg-idl-tech-panel',
        minHeight,
      )}
    >
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-6 w-4/5" />
      <div className="flex-1" />
      <Skeleton className="mt-4 h-4 w-32" />
    </div>
  )
}

export function GuideHubPageSkeleton({ count = 6 }: { count?: number }) {
  const { t } = useI18n()

  return (
    <div className="space-y-8" role="status" aria-label={t('skeleton.loadingList')}>
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-3 w-20" />
      <PageHeaderBlock />
      <div className="max-w-3xl space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        {Array.from({ length: count }).map((_, i) => (
          <GuideCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
