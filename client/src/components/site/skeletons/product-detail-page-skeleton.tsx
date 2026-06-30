'use client'

import { Skeleton } from '@/components/skeleton-primitive'
import { SectionContainer } from '@/components/site/primitives'
import { useI18n } from '@/hooks/use-i18n'
import type { ProductCatalogKind } from '@/lib/product-catalog-kind'
import { cn } from '@/utils/cn'

type Props = {
  variant?: ProductCatalogKind
}

export function ProductDetailPageSkeleton({ variant = 'design' }: Props) {
  const { t } = useI18n()
  const isDesign = variant === 'design'
  const boneClass = isDesign ? 'bg-idl-graphite-2' : undefined

  return (
    <div
      className={cn(
        'min-w-0 w-full overflow-x-clip pb-10',
        isDesign ? 'bg-idl-design text-idl-design-fg' : 'bg-idl-tech-panel text-idl-graphite',
      )}
      role="status"
      aria-label={t('skeleton.loadingProduct')}
    >
      <section className={cn('relative overflow-hidden', isDesign ? 'bg-idl-design' : 'bg-idl-tech-panel')}>
        <SectionContainer className={cn('py-4', !isDesign && 'pt-1')}>
          <Skeleton className={cn('h-3 w-56', boneClass)} />
        </SectionContainer>

        <SectionContainer
          className={cn(
            'grid min-w-0 items-start gap-8 pb-10 pt-2 sm:gap-14 sm:pb-14',
            isDesign ? 'lg:grid-cols-[1.05fr_0.95fr]' : 'lg:grid-cols-2 lg:gap-12',
          )}
        >
          <div className="space-y-3">
            <Skeleton className={cn('aspect-square w-full rounded-lg', boneClass)} />
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className={cn('aspect-square rounded-md', boneClass)} />
              ))}
            </div>
          </div>

          <div className="min-w-0 space-y-4">
            <Skeleton className={cn('h-3 w-32', boneClass)} />
            <Skeleton className={cn('h-12 w-full max-w-lg', boneClass)} />
            <Skeleton className={cn('h-5 w-2/3', boneClass)} />
            <Skeleton className={cn('h-8 w-36', boneClass)} />
            <Skeleton className={cn('h-4 w-48', boneClass)} />
            <div className="flex flex-wrap gap-2 pt-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className={cn('h-10 w-20 rounded-md', boneClass)} />
              ))}
            </div>
            <div
              className={cn(
                'space-y-3 pt-4',
                !isDesign && 'rounded-xl border border-idl-tech-border bg-idl-tech-panel p-4 shadow-[0_4px_16px_rgba(0,0,0,0.04)] sm:p-[22px]',
              )}
            >
              <Skeleton className={cn('h-8 w-32', boneClass)} />
              <Skeleton className={cn('h-4 w-40', boneClass)} />
              <div className="flex flex-wrap gap-3 pt-2">
                <Skeleton className={cn('h-12 w-40 rounded-md', boneClass)} />
                {!isDesign ? <Skeleton className={cn('h-12 flex-1 rounded-lg', boneClass)} /> : null}
                <Skeleton className={cn('h-12 w-12 rounded-md', boneClass)} />
              </div>
            </div>
          </div>
        </SectionContainer>
      </section>

      <SectionContainer className="space-y-8 py-10">
        <Skeleton className={cn('h-7 w-48', boneClass)} />
        <div className="space-y-3">
          <Skeleton className={cn('h-4 w-full max-w-3xl', boneClass)} />
          <Skeleton className={cn('h-4 w-full max-w-3xl', boneClass)} />
          <Skeleton className={cn('h-4 w-4/5 max-w-2xl', boneClass)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'overflow-hidden rounded-lg border',
                isDesign
                  ? 'border-idl-path-design-border bg-white/5'
                  : 'border-idl-tech-border bg-white',
              )}
            >
              <Skeleton
                className={cn(
                  'w-full rounded-none',
                  isDesign ? 'aspect-[4/5] bg-idl-graphite-2' : 'aspect-square',
                  !isDesign && boneClass,
                )}
              />
              <div className="p-3">
                <Skeleton className={cn('h-4 w-3/4', boneClass)} />
                <Skeleton className={cn('mt-2 h-4 w-16', boneClass)} />
              </div>
            </div>
          ))}
        </div>
      </SectionContainer>
    </div>
  )
}
