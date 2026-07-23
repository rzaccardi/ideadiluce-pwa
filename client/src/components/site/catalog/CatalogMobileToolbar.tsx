'use client'

import type { CatalogSort } from '@/features/catalog/catalog.store'
import { sortLabelForParam } from '@/lib/catalog-filters'
import { cn } from '@/utils/cn'

const SORT_OPTIONS: CatalogSort[] = ['relevance', 'price_asc', 'price_desc', 'name_asc']

type Props = {
  activeFilterCount: number
  sort: CatalogSort
  onOpenFilters: () => void
  onSelectSort: (sort: CatalogSort) => void
  className?: string
}

export function CatalogMobileToolbar({
  activeFilterCount,
  sort,
  onOpenFilters,
  onSelectSort,
  className,
}: Props) {
  return (
    <div className={cn('mt-4 flex gap-2 lg:hidden', className)}>
      <button
        type="button"
        onClick={onOpenFilters}
        className="inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg border border-idl-tech-border bg-idl-tech-panel px-3 py-2.5 text-[13px] font-bold text-idl-ink transition hover:border-idl-ink"
      >
        <span aria-hidden>☰</span>
        Mostra filtri
        {activeFilterCount > 0 ? (
          <span className="rounded-full bg-idl-amber px-1.5 py-0.5 text-[11px] font-extrabold text-white dark:text-idl-design">
            {activeFilterCount}
          </span>
        ) : null}
      </button>

      <div className="min-w-0 flex-1">
        <label className="sr-only" htmlFor="catalog-sort-mobile">
          Ordina risultati
        </label>
        <select
          id="catalog-sort-mobile"
          value={sort}
          onChange={(e) => onSelectSort(e.target.value as CatalogSort)}
          className="w-full rounded-lg border border-idl-tech-border bg-idl-tech-panel px-3 py-2.5 text-[13px] font-semibold text-idl-ink"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              Ordina · {sortLabelForParam(option)}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
