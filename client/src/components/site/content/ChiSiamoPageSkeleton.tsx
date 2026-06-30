'use client'

import { Skeleton } from '@/components/skeleton-primitive'
import { PageFlexBody, PageFlexShell } from '@/components/layout/PageFlexShell'
import { SectionContainer } from '@/components/site/primitives'

function FeatureCardSkeleton() {
  return (
    <div className="h-full rounded-xl border border-idl-path-design-border bg-idl-tech-panel p-6">
      <Skeleton className="h-3 w-8" />
      <Skeleton className="mt-4 h-5 w-3/4" />
      <Skeleton className="mt-2 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-5/6" />
    </div>
  )
}

export function ChiSiamoPageSkeleton() {
  return (
    <PageFlexShell tone="paper">
      <PageFlexBody tone="paper" className="bg-idl-cream">
        <SectionContainer className="py-10 sm:py-12 lg:py-14">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-px w-10 rounded-none" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-12 w-full max-w-lg" />
              <Skeleton className="h-12 w-4/5 max-w-md" />
              <Skeleton className="h-5 w-full max-w-xl" />
              <Skeleton className="h-4 w-full max-w-xl" />
              <Skeleton className="h-4 w-5/6 max-w-lg" />
            </div>
            <Skeleton className="aspect-[4/5] w-full rounded-md" />
          </div>
        </SectionContainer>

        <div className="bg-idl-ink">
          <SectionContainer className="py-10 sm:py-12">
            <div className="grid grid-cols-2 gap-8 text-center lg:grid-cols-4 lg:gap-10">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="mx-auto h-10 w-20 bg-idl-graphite-2" />
                  <Skeleton className="mx-auto h-4 w-28 bg-idl-graphite-2" />
                </div>
              ))}
            </div>
          </SectionContainer>
        </div>

        <SectionContainer className="py-10 sm:py-14">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <FeatureCardSkeleton key={i} />
            ))}
          </div>
        </SectionContainer>

        <SectionContainer className="pb-10 sm:pb-14">
          <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch lg:gap-8">
            <div className="rounded-[14px] border border-idl-path-design-border bg-idl-tech-panel p-7 sm:p-8">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="mt-4 h-8 w-3/4" />
              <Skeleton className="mt-2 h-4 w-48" />
              <div className="mt-4 space-y-2 border-b border-idl-border/80 pb-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-40" />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-56" />
              </div>
              <div className="mt-6 flex flex-wrap gap-2.5">
                <Skeleton className="h-11 w-32 rounded-lg" />
                <Skeleton className="h-11 w-28 rounded-lg" />
              </div>
            </div>

            <div className="relative min-h-[320px] overflow-hidden rounded-[14px] sm:min-h-[380px] lg:min-h-[420px]">
              <Skeleton className="absolute inset-0 rounded-[14px]" />
              <div className="absolute right-5 bottom-5 left-5 max-w-[calc(100%-2.5rem)] rounded-[10px] bg-idl-ink/90 px-5 py-4 sm:left-auto sm:max-w-[18rem]">
                <Skeleton className="h-6 w-36 bg-idl-graphite-2" />
                <Skeleton className="mt-2 h-4 w-full bg-idl-graphite-2" />
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <Skeleton className="h-4 w-40" />
          </div>
        </SectionContainer>

        <div className="bg-idl-ink">
          <SectionContainer className="flex flex-col items-start justify-between gap-6 py-10 sm:flex-row sm:items-center sm:py-12">
            <div className="max-w-xl space-y-3">
              <Skeleton className="h-7 w-full max-w-md bg-idl-graphite-2" />
              <Skeleton className="h-4 w-full bg-idl-graphite-2" />
              <Skeleton className="h-4 w-5/6 bg-idl-graphite-2" />
            </div>
            <Skeleton className="h-12 w-44 shrink-0 rounded-lg bg-idl-graphite-2" />
          </SectionContainer>
        </div>
      </PageFlexBody>
    </PageFlexShell>
  )
}
