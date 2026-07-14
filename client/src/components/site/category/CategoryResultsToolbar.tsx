import type { CatalogSort } from '@/features/catalog/catalog.store'
import { Skeleton } from '@/components/Skeleton'
import { cn } from '@/utils/cn'

type ActiveFilter = {
  key: string
  label: string
}

type Props = {
  shownCount: number
  totalCount?: number
  loading?: boolean
  activeFilters?: ReadonlyArray<ActiveFilter>
  sortLabel: string
  sortValue: string
  sort?: CatalogSort
  onSelectSort?: (sort: CatalogSort) => void
  onRemoveFilter?: (key: string) => void
  variant?: 'design' | 'technical'
}

const SORT_OPTIONS: Array<{ value: CatalogSort; label: string }> = [
  { value: 'relevance', label: 'Rilevanza' },
  { value: 'price_asc', label: 'Prezzo crescente' },
  { value: 'price_desc', label: 'Prezzo decrescente' },
  { value: 'name_asc', label: 'Nome A–Z' },
]

export function CategoryResultsToolbar({
  shownCount,
  totalCount,
  loading = false,
  activeFilters = [],
  sortLabel,
  sortValue,
  sort,
  onSelectSort,
  onRemoveFilter,
  variant = 'design',
}: Props) {
  const isDesign = variant === 'design'

  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-2.5">
        {loading && shownCount === 0 ? (
          <Skeleton className="h-[13.5px] w-36 rounded" aria-hidden />
        ) : (
          <span className={cn('text-[13.5px]', isDesign ? 'text-idl-ink-muted' : 'text-idl-muted')}>
            {totalCount != null ? (
              <>
                <span className={cn('font-bold', isDesign ? 'text-idl-ink' : 'font-extrabold text-idl-ink')}>
                  {shownCount}
                </span>{' '}
                prodotti su {totalCount}
              </>
            ) : (
              <>
                <span className={cn('font-extrabold', isDesign ? 'text-idl-ink' : 'text-idl-ink')}>{shownCount}</span>{' '}
                prodotti
              </>
            )}
          </span>
        )}
        {activeFilters.map((filter) => (
          <button
            key={filter.key}
            type="button"
            onClick={() => onRemoveFilter?.(filter.key)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition hover:opacity-80',
              isDesign ? 'bg-idl-cream text-idl-ink-soft' : 'bg-idl-tech-panel text-idl-graphite-2',
            )}
          >
            {filter.label}
            <span className="text-idl-amber">✕</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-start">
        <div className="flex items-center gap-2">
          <span className={cn('text-[13.5px]', isDesign ? 'text-idl-ink-muted' : 'text-idl-muted')}>{sortLabel}</span>
          {onSelectSort && sort ? (
            <select
              value={sort}
              onChange={(event) => onSelectSort(event.target.value as CatalogSort)}
              className={cn(
                'rounded-md border px-3.5 py-2 text-[13.5px] font-semibold',
                isDesign ? 'border-idl-path-design-border text-idl-ink' : 'border-idl-tech-border text-idl-ink',
              )}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <span
              className={cn(
                'rounded-md border px-3.5 py-2 text-[13.5px] font-semibold',
                isDesign ? 'border-idl-path-design-border text-idl-ink' : 'border-idl-tech-border text-idl-ink',
              )}
            >
              {sortValue} ▾
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
