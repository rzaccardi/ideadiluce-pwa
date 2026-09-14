'use client'

import { Skeleton } from '@/components/skeleton-primitive'
import { useI18n } from '@/hooks/use-i18n'

type RowProps = {
  withThumbs?: boolean
}

/** Riga account in caricamento: stessa struttura di ordini / fatture / preventivi. */
export function AccountTableRowSkeleton({ withThumbs = false }: RowProps) {
  return (
    <div
      className="overflow-hidden rounded-xl border border-idl-tech-border bg-white dark:bg-idl-tech-panel"
      aria-hidden
    >
      <div className="flex flex-wrap items-center justify-between gap-3 bg-idl-tech-panel px-[18px] py-3.5">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-5 gap-y-2">
          <Skeleton className="h-3.5 w-[5.5rem]" />
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-6 w-[4.25rem] rounded-full" />
        </div>
        <div className="flex items-center gap-[18px]">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-3.5 w-16" />
        </div>
      </div>
      {withThumbs ? (
        <div className="flex gap-2.5 px-[18px] py-3.5">
          <Skeleton className="size-[46px] rounded-[7px]" />
          <Skeleton className="size-[46px] rounded-[7px]" />
          <Skeleton className="size-[46px] rounded-[7px]" />
        </div>
      ) : null}
    </div>
  )
}

type ListProps = {
  count?: number
  withThumbs?: boolean
}

export function AccountTableSkeleton({ count = 4, withThumbs = false }: ListProps) {
  const { t } = useI18n()
  return (
    <div className="flex flex-col gap-3.5" role="status" aria-label={t('skeleton.loadingList')}>
      <span className="sr-only">{t('skeleton.loadingList')}</span>
      {Array.from({ length: count }).map((_, index) => (
        <AccountTableRowSkeleton key={index} withThumbs={withThumbs} />
      ))}
    </div>
  )
}
