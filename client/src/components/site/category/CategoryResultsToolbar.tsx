import { cn } from '@/utils/cn'

type ActiveFilter = {
  label: string
}

type Props = {
  shownCount: number
  totalCount?: number
  activeFilters?: ReadonlyArray<ActiveFilter>
  sortLabel: string
  sortValue: string
  variant?: 'design' | 'technical'
  compareEnabled?: boolean
}

export function CategoryResultsToolbar({
  shownCount,
  totalCount,
  activeFilters = [],
  sortLabel,
  sortValue,
  variant = 'design',
  compareEnabled,
}: Props) {
  const isDesign = variant === 'design'

  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-2.5">
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
              <span className={cn('font-extrabold', isDesign ? 'text-idl-ink' : 'text-idl-ink')}>{shownCount}</span> prodotti
            </>
          )}
        </span>
        {activeFilters.map((filter) => (
          <span
            key={filter.label}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs',
              isDesign ? 'bg-idl-cream text-idl-ink-soft' : 'bg-idl-tech-panel text-idl-graphite-2',
            )}
          >
            {filter.label}
            <span className="text-idl-amber">✕</span>
          </span>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-start">
        {!isDesign && compareEnabled ? (
          <span className="hidden items-center gap-1.5 text-[13px] text-idl-muted sm:inline-flex">
            <span className="relative inline-block h-[18px] w-[34px] rounded-full bg-idl-amber">
              <span className="absolute top-0.5 right-0.5 size-3.5 rounded-full bg-white" />
            </span>
            Confronta
          </span>
        ) : null}
        <div className="flex items-center gap-2">
          <span className={cn('text-[13.5px]', isDesign ? 'text-idl-ink-muted' : 'text-idl-muted')}>{sortLabel}</span>
          <span
            className={cn(
              'rounded-md border px-3.5 py-2 text-[13.5px] font-semibold',
              isDesign ? 'border-idl-path-design-border text-idl-ink' : 'border-idl-tech-border text-idl-ink',
            )}
          >
            {sortValue} ▾
          </span>
        </div>
      </div>
    </div>
  )
}
