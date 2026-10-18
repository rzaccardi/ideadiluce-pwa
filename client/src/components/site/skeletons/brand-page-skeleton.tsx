'use client'

import { Skeleton } from '@/components/skeleton-primitive'
import { SectionContainer } from '@/components/site/primitives'
import { useI18n } from '@/hooks/use-i18n'

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

      <SectionContainer className="pb-12 pt-10 sm:pb-14 sm:pt-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col rounded-xl border border-idl-tech-border bg-white p-5 dark:bg-idl-tech-panel sm:p-6"
            >
              <div className="mb-3.5 flex h-[56px] items-center justify-center border-b border-idl-tech-panel pb-3.5">
                <Skeleton className="h-6 w-28" />
              </div>
              <Skeleton className="mb-2.5 h-5 w-16 rounded-[5px]" />
              <Skeleton className="mb-2 h-4 w-full" />
              <Skeleton className="mb-3.5 h-4 w-3/4" />
              <div className="mt-auto flex items-center justify-between pt-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-14" />
              </div>
            </div>
          ))}
        </div>
      </SectionContainer>
    </div>
  )
}
