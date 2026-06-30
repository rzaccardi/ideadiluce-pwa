'use client'

import { PageFlexBody, PageFlexShell } from '@/components/layout/PageFlexShell'
import { SectionContainer } from '@/components/site/primitives'
import { CatalogProductCardSkeleton } from '@/components/site/catalog/CatalogProductCardSkeleton'
import { Skeleton } from '@/components/skeleton-primitive'

export function CatalogPageSkeleton() {
  return (
    <PageFlexShell tone="tech-panel">
      <section className="border-b border-idl-tech-border bg-idl-tech-panel">
        <SectionContainer className="py-6 sm:py-7">
          <Skeleton className="mb-3 h-3 w-48" />
          <Skeleton className="h-9 w-72 max-w-full" />
          <Skeleton className="mt-2 h-4 w-56" />
          <div className="mt-5 flex gap-2">
            <Skeleton className="h-10 w-36 rounded-lg" />
            <Skeleton className="h-10 w-40 rounded-lg" />
          </div>
        </SectionContainer>
      </section>

      <section className="border-b border-idl-tech-border bg-idl-tech-panel">
        <SectionContainer className="py-3">
          <div className="flex gap-2 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-28 shrink-0 rounded-full" />
            ))}
          </div>
        </SectionContainer>
      </section>

      <PageFlexBody tone="tech-panel">
        <SectionContainer className="py-6 sm:py-8 lg:py-10">
          <div className="grid gap-6 lg:grid-cols-[256px_1fr]">
            <Skeleton className="hidden h-[420px] rounded-lg lg:block" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-full rounded-lg lg:hidden" />
              <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <CatalogProductCardSkeleton key={i} variant="catalog" />
                ))}
              </div>
            </div>
          </div>
        </SectionContainer>
      </PageFlexBody>
    </PageFlexShell>
  )
}
