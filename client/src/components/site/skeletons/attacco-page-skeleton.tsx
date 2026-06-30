'use client'

import { Skeleton } from '@/components/skeleton-primitive'
import { SectionContainer } from '@/components/site/primitives'
import { useI18n } from '@/hooks/use-i18n'
import { SocketTileCardSkeleton } from './editorial-hub-skeleton'

export function AttaccoPageSkeleton() {
  const { t } = useI18n()

  return (
    <div className="bg-idl-tech-panel" role="status" aria-label={t('skeleton.loadingPageHeader')}>
      <section className="border-b border-idl-tech-border bg-idl-tech-panel">
        <SectionContainer className="py-10 sm:py-12">
          <Skeleton className="mb-4 h-4 w-48" />
          <Skeleton className="h-3 w-32" />
          <Skeleton className="mt-4 h-10 w-full max-w-xl" />
          <Skeleton className="mt-3 h-5 w-full max-w-2xl" />
          <Skeleton className="mt-6 h-11 w-44 rounded-lg" />
        </SectionContainer>
      </section>

      <SectionContainer className="py-8">
        <Skeleton className="h-12 w-full max-w-2xl rounded-[10px]" />
      </SectionContainer>

      <SectionContainer className="py-8 sm:py-10">
        <Skeleton className="mb-2 h-7 w-48" />
        <Skeleton className="mb-6 h-4 w-full max-w-xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col rounded-[10px] border border-idl-tech-border bg-idl-tech-panel p-5"
            >
              <div className="mb-3.5 flex items-center gap-4">
                <Skeleton className="size-[60px] shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      </SectionContainer>

      <SectionContainer className="pb-8">
        <Skeleton className="mb-5 h-7 w-40" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SocketTileCardSkeleton key={i} />
          ))}
        </div>
      </SectionContainer>

      <SectionContainer className="pb-10">
        <Skeleton className="h-32 w-full rounded-xl" />
      </SectionContainer>
    </div>
  )
}
