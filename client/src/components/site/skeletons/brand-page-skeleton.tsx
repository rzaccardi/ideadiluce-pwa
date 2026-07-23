'use client'

import { Skeleton } from '@/components/skeleton-primitive'
import { SectionContainer } from '@/components/site/primitives'
import { useI18n } from '@/hooks/use-i18n'
import { BrandDirectoryItemSkeleton } from './editorial-hub-skeleton'

export function BrandPageSkeleton() {
  const { t } = useI18n()

  return (
    <div className="bg-[#f4f5f7]" role="status" aria-label={t('skeleton.loadingPageHeader')}>
      <section className="border-b border-idl-tech-border bg-idl-tech-panel">
        <SectionContainer className="pb-8 pt-4 sm:pb-7">
          <Skeleton className="mb-4 h-4 w-48" />
          <Skeleton className="mb-4 h-3 w-28" />
          <Skeleton className="h-10 w-full max-w-xl" />
          <Skeleton className="mt-3 h-5 w-full max-w-2xl" />
          <Skeleton className="mt-6 h-12 w-full max-w-2xl rounded-[10px]" />
          <div className="mt-4 flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-24 rounded-[30px]" />
            ))}
          </div>
        </SectionContainer>
      </section>

      <SectionContainer className="py-8 sm:py-10">
        <Skeleton className="mb-6 h-7 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-idl-tech-border bg-white p-5 dark:bg-idl-tech-panel">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="mt-2 h-4 w-full" />
              <Skeleton className="mt-4 h-4 w-24" />
            </div>
          ))}
        </div>
      </SectionContainer>

      <SectionContainer className="pb-10">
        <Skeleton className="mb-5 h-7 w-56" />
        <div className="grid grid-cols-2 overflow-hidden rounded-[10px] border border-idl-tech-border sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <BrandDirectoryItemSkeleton key={i} />
          ))}
        </div>
      </SectionContainer>

      <SectionContainer className="pb-10">
        <Skeleton className="h-40 w-full rounded-xl" />
      </SectionContainer>
    </div>
  )
}
