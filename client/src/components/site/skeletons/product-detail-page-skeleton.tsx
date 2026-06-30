'use client'

import { Skeleton } from '@/components/skeleton-primitive'
import { SectionContainer } from '@/components/site/primitives'
import { useI18n } from '@/hooks/use-i18n'

export function ProductDetailPageSkeleton() {
  const { t } = useI18n()

  return (
    <div
      className="min-w-0 w-full overflow-x-clip bg-idl-design pb-10 text-idl-design-fg"
      role="status"
      aria-label={t('skeleton.loadingProduct')}
    >
      <section className="relative overflow-hidden bg-idl-design">
        <SectionContainer className="py-4">
          <Skeleton className="h-3 w-56 bg-idl-graphite-2" />
        </SectionContainer>

        <SectionContainer className="grid min-w-0 items-start gap-8 pb-10 pt-2 sm:gap-14 sm:pb-14 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-3">
            <Skeleton className="aspect-square w-full rounded-lg bg-idl-graphite-2" />
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-md bg-idl-graphite-2" />
              ))}
            </div>
          </div>

          <div className="min-w-0 space-y-4">
            <Skeleton className="h-3 w-32 bg-idl-graphite-2" />
            <Skeleton className="h-12 w-full max-w-lg bg-idl-graphite-2" />
            <Skeleton className="h-5 w-2/3 bg-idl-graphite-2" />
            <Skeleton className="h-8 w-36 bg-idl-graphite-2" />
            <Skeleton className="h-4 w-48 bg-idl-graphite-2" />
            <div className="flex flex-wrap gap-2 pt-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-20 rounded-md bg-idl-graphite-2" />
              ))}
            </div>
            <div className="flex flex-wrap gap-3 pt-4">
              <Skeleton className="h-12 w-40 rounded-md bg-idl-graphite-2" />
              <Skeleton className="h-12 w-12 rounded-md bg-idl-graphite-2" />
            </div>
          </div>
        </SectionContainer>
      </section>

      <SectionContainer className="space-y-8 py-10">
        <Skeleton className="h-7 w-48 bg-idl-graphite-2" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full max-w-3xl bg-idl-graphite-2" />
          <Skeleton className="h-4 w-full max-w-3xl bg-idl-graphite-2" />
          <Skeleton className="h-4 w-4/5 max-w-2xl bg-idl-graphite-2" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-lg border border-idl-path-design-border bg-white/5">
              <Skeleton className="aspect-[4/5] w-full rounded-none bg-idl-graphite-2" />
              <div className="p-3">
                <Skeleton className="h-4 w-3/4 bg-idl-graphite-2" />
                <Skeleton className="mt-2 h-4 w-16 bg-idl-graphite-2" />
              </div>
            </div>
          ))}
        </div>
      </SectionContainer>
    </div>
  )
}
