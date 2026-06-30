'use client'

import { useMemo, useState } from 'react'
import { Link } from '@/lib/navigation'
import { SectionContainer } from '../../primitives'
import { BrandNameDisplay } from '../BrandNameDisplay'
import {
  BRAND_DIRECTORY_FILTERS,
  isDesignCategory,
  primaryCategoryLabel,
  type BrandCard,
  type BrandCategory,
} from '@/lib/brand.defaults'
import type { LocalePathFn } from '../../sections/types'
import { cn } from '@/utils/cn'

const PAGE_SIZE = 8

type Props = {
  brands: BrandCard[]
  activeFilter: BrandCategory | 'all'
  onFilterChange: (filter: BrandCategory | 'all') => void
  onReset: () => void
  lp: LocalePathFn
}

export function BrandDirectorySection({
  brands,
  activeFilter,
  onFilterChange,
  onReset,
  lp,
}: Props) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const filtered = useMemo(() => {
    return brands.filter((brand) => {
      if (brand.featured) return false
      const matchesFilter = activeFilter === 'all' || brand.categories.includes(activeFilter)
      return matchesFilter
    })
  }, [activeFilter, brands])

  const visible = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length

  return (
    <section className="bg-[#f3f2ee]">
      <SectionContainer className="pb-12 pt-8 sm:pb-14">
        <div className="mb-7 rounded-2xl border border-idl-tech-border bg-idl-tech-panel p-4 shadow-[0_6px_22px_rgba(0,0,0,0.04)] sm:p-5">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <span className="shrink-0 font-mono text-[10.5px] tracking-[0.12em] text-idl-muted uppercase">
              Tipologia
            </span>
            <div className="flex flex-1 flex-wrap gap-2">
              {BRAND_DIRECTORY_FILTERS.map((filter) => {
                const active = activeFilter === filter.id
                const count =
                  filter.id === 'all'
                    ? brands.filter((b) => !b.featured).length
                    : brands.filter(
                        (b) => !b.featured && b.categories.includes(filter.id as BrandCategory),
                      ).length
                return (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => {
                      onFilterChange(filter.id)
                      setVisibleCount(PAGE_SIZE)
                    }}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-[30px] border px-3.5 py-2 text-[13px] font-semibold transition',
                      active
                        ? 'border-idl-graphite bg-idl-graphite font-bold text-white'
                        : 'border-idl-tech-chip-border bg-idl-tech-panel text-idl-graphite-2 hover:border-idl-brass hover:text-idl-graphite',
                    )}
                  >
                    {filter.dot ? (
                      <span className="size-2 rounded-full" style={{ backgroundColor: filter.dot }} />
                    ) : null}
                    {filter.label}
                    {filter.id === 'all' ? (
                      <span className="rounded-[20px] bg-idl-tech-panel/20 px-1.5 py-0.5 font-mono text-[11px]">{count}</span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="mt-3.5 flex flex-wrap items-center gap-2.5 border-t border-idl-tech-panel pt-3.5">
            <span className="text-[12.5px] text-idl-muted sm:border-r sm:border-idl-tech-border sm:pr-3.5">
              Disponibili subito · Novità · Promo
            </span>
            <span className="flex-1 text-[13.5px] text-idl-graphite-2">
              <strong className="text-idl-graphite">{filtered.length}</strong> brand
            </span>
            <button
              type="button"
              onClick={() => {
                onReset()
                setVisibleCount(PAGE_SIZE)
              }}
              className="text-[13px] font-bold text-idl-brass"
            >
              Azzera
            </button>
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="rounded-xl border border-idl-tech-border bg-idl-tech-panel px-6 py-12 text-center text-[15px] text-idl-graphite-2">
            Nessun brand corrisponde ai filtri selezionati.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {visible.map((brand) => {
              const design = isDesignCategory(brand.categories)
              const badge = primaryCategoryLabel(brand.categories)
              return (
                <Link
                  key={brand.slug}
                  to={lp(brand.href)}
                  className="flex flex-col rounded-xl border border-idl-tech-border bg-idl-tech-panel p-5 transition hover:border-[#cfd4db] hover:shadow-[0_8px_22px_rgba(0,0,0,0.05)] sm:p-6"
                >
                  <div className="mb-3.5 flex h-[46px] items-center justify-center border-b border-idl-tech-panel pb-3.5">
                    <BrandNameDisplay name={brand.name} style={brand.displayStyle} size="sm" />
                  </div>
                  <span
                    className={cn(
                      'mb-2.5 inline-flex self-start rounded-[5px] border px-2 py-0.5 font-mono text-[10px] tracking-[0.06em]',
                      design
                        ? 'border-[#ece2d2] bg-idl-path-design text-idl-brass'
                        : 'border-idl-tech-chip-border bg-idl-tech-chip text-idl-graphite-2',
                    )}
                  >
                    {badge}
                  </span>
                  <p className="mb-3.5 text-[13px] leading-snug text-idl-graphite-2">{brand.description}</p>
                  <p className="mb-3.5 text-[12px] text-idl-muted">{brand.productLines}</p>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-[12px] text-idl-muted">
                      {brand.productCount > 0 ? `${brand.productCount} prodotti` : 'Catalogo'}
                    </span>
                    <span className="text-[13px] font-bold text-idl-brass">Scopri →</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {hasMore ? (
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
              className="rounded-lg border border-idl-tech-border bg-white px-8 py-3 text-[14px] font-semibold text-idl-graphite transition hover:border-idl-brass hover:text-idl-brass dark:bg-idl-tech-panel"
            >
              Carica altri brand
            </button>
          </div>
        ) : null}
      </SectionContainer>
    </section>
  )
}
