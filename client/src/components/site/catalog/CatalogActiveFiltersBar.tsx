'use client'

import type { CatalogActiveFilter } from '@/lib/catalog-filters'
import { sortLabelForParam } from '@/lib/catalog-filters'
import type { CatalogSort } from '@/features/catalog/catalog.store'
import { cn } from '@/utils/cn'

type Props = {
  filtersOpen: boolean
  onToggleFilters: () => void
  activeFilters: ReadonlyArray<CatalogActiveFilter>
  sort: CatalogSort
  onSelectSort: (sort: CatalogSort) => void
  onRemoveFilter: (key: string) => void
  onResetFilters: () => void
}

const SORT_OPTIONS: CatalogSort[] = ['relevance', 'price_asc', 'price_desc', 'name_asc']

export function CatalogActiveFiltersBar({
  filtersOpen,
  onToggleFilters,
  activeFilters,
  sort,
  onSelectSort,
  onRemoveFilter,
  onResetFilters,
}: Props) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 sm:gap-2.5">
      <button
        type="button"
        onClick={onToggleFilters}
        className="inline-flex items-center gap-1.5 rounded-lg border border-idl-tech-border bg-idl-tech-panel px-3 py-2 text-[13px] font-bold text-idl-ink transition hover:border-idl-ink"
      >
        <span aria-hidden>{filtersOpen ? '⟨' : '☰'}</span>
        {filtersOpen ? 'Nascondi filtri' : 'Mostra filtri'}
      </button>

      {activeFilters.length > 0 ? (
        <>
          <span className="mx-0.5 hidden h-5 w-px bg-idl-tech-border sm:block" aria-hidden />
          <span className="text-[13px] text-idl-muted">Filtri attivi:</span>
          {activeFilters.map((filter) => (
            <span
              key={filter.key}
              className="inline-flex items-center gap-1.5 rounded-[30px] border border-idl-tech-border bg-idl-tech-panel px-3 py-1.5 text-[12.5px] text-idl-graphite-2"
            >
              {filter.label}
              <button
                type="button"
                onClick={() => onRemoveFilter(filter.key)}
                className="text-idl-amber"
                aria-label={`Rimuovi filtro ${filter.label}`}
              >
                ✕
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={onResetFilters}
            className="text-[12.5px] text-idl-muted hover:text-idl-ink"
          >
            Rimuovi tutti
          </button>
        </>
      ) : null}

      <div className="relative ml-auto w-full sm:w-auto">
        <label className="sr-only" htmlFor="catalog-sort">
          Ordina risultati
        </label>
        <select
          id="catalog-sort"
          value={sort}
          onChange={(e) => onSelectSort(e.target.value as CatalogSort)}
          className={cn(
            'w-full rounded-lg border border-idl-tech-border bg-idl-tech-panel px-3.5 py-2 text-[13.5px] font-semibold text-idl-ink sm:w-auto',
          )}
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
