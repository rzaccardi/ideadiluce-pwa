'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from '@/lib/navigation'
import { useInfiniteScrollSentinel } from '@/hooks/use-infinite-scroll-sentinel'
import { SectionContainer } from '../../primitives'
import { BrandNameDisplay } from '../BrandNameDisplay'
import {
  brandAreaBadgeClassName,
  brandAreaBadges,
  type BrandCard,
  type BrandCategory,
} from '@/lib/brand.defaults'
import type { LocalePathFn } from '../../sections/types'
import { cn } from '@/utils/cn'
import { Skeleton } from '@/components/skeleton-primitive'

const PAGE_SIZE = 24

type Props = {
  brands: BrandCard[]
  activeFilter: BrandCategory | 'all'
  lp: LocalePathFn
}

function BrandCardSkeleton() {
  return (
    <div className="flex flex-col rounded-xl border border-idl-tech-border bg-idl-tech-panel p-5 sm:p-6">
      <div className="mb-3.5 flex h-[56px] items-center justify-start border-b border-idl-tech-panel pb-3.5">
        <Skeleton className="h-8 w-32" />
      </div>
      <Skeleton className="mb-2.5 h-5 w-16 rounded-[5px]" />
      <Skeleton className="mb-2 h-4 w-full" />
      <Skeleton className="mb-3.5 h-4 w-3/4" />
      <Skeleton className="mb-3.5 h-3 w-24" />
      <div className="mt-auto flex items-center justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-14" />
      </div>
    </div>
  )
}

export function BrandDirectorySection({ brands, activeFilter, lp }: Props) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
    setLoadingMore(false)
  }, [activeFilter])

  const filtered = useMemo(() => {
    return brands.filter((brand) => {
      return activeFilter === 'all' || brand.categories.includes(activeFilter)
    })
  }, [activeFilter, brands])

  const visible = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length

  const onLoadMore = useCallback(() => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    window.setTimeout(() => {
      setVisibleCount((count) => count + PAGE_SIZE)
      setLoadingMore(false)
    }, 180)
  }, [hasMore, loadingMore])

  const loadMoreRef = useInfiniteScrollSentinel({
    enabled: true,
    hasMore,
    loading: loadingMore,
    onLoadMore,
  })

  return (
    <section className="bg-[#f3f2ee]">
      <SectionContainer className="pb-12 pt-10 sm:pb-14 sm:pt-12">
        {visible.length === 0 ? (
          <div className="rounded-xl border border-idl-tech-border bg-idl-tech-panel px-6 py-12 text-center text-[15px] text-idl-graphite-2">
            Nessun brand corrisponde ai filtri selezionati.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((brand) => {
              const badges = brandAreaBadges(brand.categories)
              return (
                <Link
                  key={brand.slug}
                  to={lp(brand.href)}
                  className="flex flex-col rounded-xl border border-idl-tech-border bg-idl-tech-panel p-5 transition hover:border-[#cfd4db] hover:shadow-[0_8px_22px_rgba(0,0,0,0.05)] sm:p-6"
                >
                  <div className="mb-3.5 flex h-[56px] items-center justify-start border-b border-idl-tech-panel pb-3.5">
                    <BrandNameDisplay
                      name={brand.name}
                      slug={brand.slug}
                      style={brand.displayStyle}
                      size="sm"
                      logoHeight={36}
                      maxWidthRem={12}
                    />
                  </div>
                  {badges.length ? (
                    <div className="mb-2.5 flex flex-wrap gap-1">
                      {badges.map((badge) => (
                        <span
                          key={badge.area}
                          className={cn(
                            'inline-flex self-start rounded-[5px] border px-2 py-0.5 font-mono text-[10px] tracking-[0.06em]',
                            brandAreaBadgeClassName(badge.area),
                          )}
                        >
                          {badge.label}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {brand.description ? (
                    <p className="mb-3.5 text-[13px] leading-snug text-idl-graphite-2">
                      {brand.description}
                    </p>
                  ) : null}
                  {brand.productLines ? (
                    <p className="mb-3.5 text-[12px] text-idl-muted">{brand.productLines}</p>
                  ) : null}
                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-[12px] text-idl-muted">
                      {brand.productCount > 0 ? `${brand.productCount} prodotti` : 'Catalogo'}
                    </span>
                    <span className="text-[13px] font-bold text-idl-brass">Scopri →</span>
                  </div>
                </Link>
              )
            })}
            {loadingMore
              ? Array.from({ length: 3 }).map((_, i) => <BrandCardSkeleton key={`sk-${i}`} />)
              : null}
          </div>
        )}

        {hasMore ? (
          <div ref={loadMoreRef} className="h-8 w-full" aria-hidden />
        ) : null}
      </SectionContainer>
    </section>
  )
}
