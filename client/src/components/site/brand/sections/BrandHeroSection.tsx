'use client'

import { useState, type FormEvent } from 'react'
import { useNavigate } from '@/lib/navigation'
import { CategoryBreadcrumb } from '../../category/CategoryBreadcrumb'
import { Eyebrow, SectionContainer } from '../../primitives'
import { BRAND_HERO, BRAND_HERO_FILTERS, type BrandCategory } from '@/lib/brand.defaults'
import { ui } from '@/lib/ui-classes'
import type { LocalePathFn } from '../../sections/types'
import { cn } from '@/utils/cn'

type Props = {
  lp: LocalePathFn
  activeFilter: BrandCategory | 'all'
  onFilterChange: (filter: BrandCategory | 'all') => void
  onSearchQuery: (query: string) => void
}

export function BrandHeroSection({ lp, activeFilter, onFilterChange, onSearchQuery }: Props) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = query.trim()
    onSearchQuery(trimmed)
    if (trimmed) {
      navigate(`${lp('/catalogo')}?q=${encodeURIComponent(trimmed)}`)
    }
  }

  return (
    <section className="border-b border-idl-tech-border bg-white">
      <SectionContainer className="pb-8 pt-4 sm:pb-7">
        <CategoryBreadcrumb
          items={[{ label: 'Home', href: '/' }, { label: 'Brand' }]}
          lp={lp}
          variant="technical"
        />
        <div className="max-w-2xl">
          <Eyebrow variant="neutral" className="mb-4 text-idl-muted">
            {BRAND_HERO.eyebrow}
          </Eyebrow>
          <h1 className="text-[32px] leading-[1.06] font-extrabold tracking-tight text-idl-graphite sm:text-[40px]">
            {BRAND_HERO.title}
          </h1>
          <p className="mt-3.5 text-[15px] leading-relaxed text-idl-graphite-2 sm:text-[16.5px]">
            {BRAND_HERO.subtitle}
          </p>
        </div>
        <form
          onSubmit={onSubmit}
          className="mt-6 flex max-w-2xl items-center gap-2.5 rounded-[10px] border-[1.5px] border-idl-tech-chip-border bg-idl-tech-panel py-1.5 pl-5 pr-1.5"
        >
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              onSearchQuery(e.target.value)
            }}
            placeholder={BRAND_HERO.searchPlaceholder}
            className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-idl-muted"
          />
          <button type="submit" className={cn(ui.ctaInk, 'shrink-0 rounded-[7px] bg-idl-graphite px-6 py-3 text-[14.5px] font-bold text-white')}>
            {BRAND_HERO.searchCta}
          </button>
        </form>
        <div className="mt-4 flex flex-wrap gap-2">
          {BRAND_HERO_FILTERS.map((filter) => {
            const active = activeFilter === filter.id
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => onFilterChange(filter.id)}
                className={cn(
                  ui.interactive,
                  'rounded-[30px] px-4 py-2 text-[13px] font-semibold',
                  active
                    ? 'bg-idl-graphite font-bold text-white hover:bg-[#2a2d35]'
                    : 'border border-idl-tech-chip-border bg-white text-idl-graphite-2 hover:border-idl-amber hover:text-idl-amber',
                )}
              >
                {filter.label}
              </button>
            )
          })}
        </div>
      </SectionContainer>
    </section>
  )
}
