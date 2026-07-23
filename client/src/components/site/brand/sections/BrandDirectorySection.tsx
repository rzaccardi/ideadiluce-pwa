'use client'

import { useEffect, useMemo, useState } from 'react'
import { Link } from '@/lib/navigation'
import { SectionContainer } from '../../primitives'
import { BrandNameDisplay } from '../BrandNameDisplay'
import {
  isDesignCategory,
  primaryCategoryLabel,
  type BrandCard,
  type BrandCategory,
} from '@/lib/brand.defaults'
import type { LocalePathFn } from '../../sections/types'
import { cn } from '@/utils/cn'

const PAGE_SIZE = 24

type Props = {
  brands: BrandCard[]
  activeFilter: BrandCategory | 'all'
  lp: LocalePathFn
}

export function BrandDirectorySection({ brands, activeFilter, lp }: Props) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [activeFilter])

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
                    <BrandNameDisplay
                      name={brand.name}
                      slug={brand.slug}
                      style={brand.displayStyle}
                      size="sm"
                    />
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
