'use client'

import { PageFlexBody, PageFlexShell } from '@/components/layout/PageFlexShell'
import { SectionContainer } from '@/components/site/primitives'
import { CatalogFiltersSkeleton, ProductGridSkeleton, Skeleton } from '@/components/Skeleton'

export function CatalogPageSkeleton() {
  return (
    <PageFlexShell tone="tech-panel">
      <section className="border-b border-idl-tech-border bg-white">
        <SectionContainer className="py-6 sm:py-7">
          <Skeleton className="mb-3 h-3 w-48" />
          <Skeleton className="h-9 w-72 max-w-full" />
          <Skeleton className="mt-2 h-4 w-56" />
        </SectionContainer>
      </section>
      <PageFlexBody tone="tech-panel">
        <SectionContainer className="py-6 sm:py-8 lg:py-10">
          <CatalogFiltersSkeleton />
          <ProductGridSkeleton count={8} className="mt-6 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" />
        </SectionContainer>
      </PageFlexBody>
    </PageFlexShell>
  )
}
