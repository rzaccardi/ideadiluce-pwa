'use client'

import { Skeleton } from '@/components/skeleton-primitive'
import { GuideCardSkeleton } from '@/components/site/skeletons/guide-hub-skeleton'
import { useI18n } from '@/hooks/use-i18n'
import type { SitePageKey } from '@/types/site-content'

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

type EditorialHubKey = Extract<SitePageKey, 'attacco' | 'ambienti' | 'brand' | 'guide'>

export function SocketTileCardSkeleton() {
  return (
    <div className="flex min-h-[120px] flex-col rounded-lg border border-idl-tech-border bg-idl-tech-panel p-5">
      <Skeleton className="h-7 w-16" />
      <Skeleton className="mt-2 h-4 w-full" />
      <Skeleton className="mt-auto pt-4 h-3 w-24" />
    </div>
  )
}

export function RoomCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-idl-border bg-white">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="p-5">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="mt-2 h-4 w-full" />
      </div>
    </div>
  )
}

export function BrandDirectoryItemSkeleton() {
  return (
    <div className="flex min-h-[88px] flex-col items-center justify-center border-b border-r border-idl-tech-border bg-white px-3 py-5 dark:bg-idl-tech-panel">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="mt-1.5 h-3 w-14" />
    </div>
  )
}

function EditorialHeaderSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-3 w-24" />
      <PageHeaderBlock />
      <div className="max-w-3xl space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  )
}

const GRID_BY_PAGE: Record<EditorialHubKey, { count: number; className: string }> = {
  attacco: { count: 8, className: 'grid gap-3 sm:grid-cols-2 lg:grid-cols-4' },
  ambienti: { count: 6, className: 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3' },
  brand: { count: 8, className: 'grid grid-cols-2 overflow-hidden rounded-[10px] border border-idl-tech-border sm:grid-cols-3 lg:grid-cols-4' },
  guide: { count: 6, className: 'grid gap-4 sm:grid-cols-2 lg:grid-cols-2' },
}

function EditorialGridSkeleton({ pageKey }: { pageKey: EditorialHubKey }) {
  const { count, className } = GRID_BY_PAGE[pageKey]

  if (pageKey === 'attacco') {
    return (
      <div className={className}>
        {Array.from({ length: count }).map((_, i) => (
          <SocketTileCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (pageKey === 'ambienti') {
    return (
      <div className={className}>
        {Array.from({ length: count }).map((_, i) => (
          <RoomCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (pageKey === 'brand') {
    return (
      <div className={className}>
        {Array.from({ length: count }).map((_, i) => (
          <BrandDirectoryItemSkeleton key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <GuideCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function EditorialHubSkeleton({ pageKey }: { pageKey: EditorialHubKey }) {
  const { t } = useI18n()

  return (
    <div className="space-y-8" role="status" aria-label={t('skeleton.loadingPageHeader')}>
      <EditorialHeaderSkeleton />
      <EditorialGridSkeleton pageKey={pageKey} />
    </div>
  )
}

export function StaticHubSectionSkeleton({
  count = 6,
  variant = 'rooms',
}: {
  count?: number
  variant?: 'rooms' | 'brand' | 'sockets'
}) {
  const { t } = useI18n()
  const gridClass =
    variant === 'brand'
      ? 'grid grid-cols-2 overflow-hidden rounded-[10px] border border-idl-tech-border sm:grid-cols-3 lg:grid-cols-4'
      : variant === 'sockets'
        ? 'grid gap-3 sm:grid-cols-2 lg:grid-cols-4'
        : 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'

  return (
    <div className={gridClass} role="status" aria-label={t('skeleton.loadingPageHeader')}>
      {Array.from({ length: count }).map((_, i) => {
        if (variant === 'brand') return <BrandDirectoryItemSkeleton key={i} />
        if (variant === 'sockets') return <SocketTileCardSkeleton key={i} />
        return <RoomCardSkeleton key={i} />
      })}
    </div>
  )
}
