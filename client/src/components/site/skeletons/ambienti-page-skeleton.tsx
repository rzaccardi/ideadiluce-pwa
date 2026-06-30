'use client'

import { Skeleton } from '@/components/skeleton-primitive'
import { SectionContainer } from '@/components/site/primitives'
import { useI18n } from '@/hooks/use-i18n'
import { RoomCardSkeleton } from './editorial-hub-skeleton'

export function AmbientiPageSkeleton() {
  const { t } = useI18n()

  return (
    <div className="bg-idl-tech-panel" role="status" aria-label={t('skeleton.loadingPageHeader')}>
      <section className="border-b border-idl-tech-border bg-idl-tech-panel">
        <SectionContainer className="py-10 sm:py-12">
          <Skeleton className="mb-4 h-4 w-48" />
          <Skeleton className="h-3 w-28" />
          <Skeleton className="mt-4 h-10 w-full max-w-xl" />
          <Skeleton className="mt-3 h-5 w-full max-w-2xl" />
        </SectionContainer>
      </section>

      <SectionContainer className="py-10 sm:py-12">
        <Skeleton className="mb-6 h-7 w-56" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <RoomCardSkeleton key={i} />
          ))}
        </div>
      </SectionContainer>

      <SectionContainer className="pb-10">
        <Skeleton className="mb-5 h-7 w-48" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[16/10] rounded-lg" />
          ))}
        </div>
      </SectionContainer>

      <SectionContainer className="pb-10">
        <Skeleton className="h-36 w-full rounded-xl" />
      </SectionContainer>
    </div>
  )
}
