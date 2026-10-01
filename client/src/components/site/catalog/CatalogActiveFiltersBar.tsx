'use client'

import type { CatalogActiveFilter } from '@/lib/catalog-filters'
import type { CatalogSort } from '@/features/catalog/catalog.store'
import type { MessageKey } from '@/i18n/messages/keys'
import { useI18n } from '@/hooks/use-i18n'
import { translateCatalogTaxonomyLabel } from '@/lib/catalog-taxonomy-i18n'
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

const SORT_LABEL_KEYS: Record<CatalogSort, MessageKey> = {
  relevance: 'catalog.sortRelevance',
  price_asc: 'catalog.sortPriceAsc',
  price_desc: 'catalog.sortPriceDesc',
  name_asc: 'catalog.sortName',
}

function translateActiveFilterLabel(filter: CatalogActiveFilter, t: (key: MessageKey) => string): string {
  if (filter.key === 'inStock') return t('catalog.readyToShip')
  if (filter.key === 'brand') {
    const name = filter.label.replace(/^Brand:\s*/i, '').replace(/^Marca:\s*/i, '')
    return `${t('catalog.brand')}: ${name}`
  }
  if (
    filter.key === 'category' ||
    filter.key === 'tipologia' ||
    filter.key === 'ambiente' ||
    filter.key === 'stile' ||
    filter.key === 'world' ||
    filter.key === 'tag'
  ) {
    return translateCatalogTaxonomyLabel(filter.label, t, filter.label)
  }
  return filter.label
}

export function CatalogActiveFiltersBar({
  filtersOpen,
  onToggleFilters,
  activeFilters,
  sort,
  onSelectSort,
  onRemoveFilter,
  onResetFilters,
}: Props) {
  const { t, tParams } = useI18n()

  return (
    <div
      className={cn(
        'mb-4 flex flex-wrap items-center gap-2 sm:gap-2.5',
        activeFilters.length === 0 && 'hidden lg:flex',
      )}
    >
      <button
        type="button"
        onClick={onToggleFilters}
        className="hidden items-center gap-1.5 rounded-lg border border-idl-tech-border bg-idl-tech-panel px-3 py-2 text-[13px] font-bold text-idl-ink transition hover:border-idl-ink lg:inline-flex"
      >
        <span aria-hidden>{filtersOpen ? '⟨' : '☰'}</span>
        {filtersOpen ? t('catalog.hideFilters') : t('catalog.showFilters')}
      </button>

      {activeFilters.length > 0 ? (
        <>
          <span className="mx-0.5 hidden h-5 w-px bg-idl-tech-border sm:block" aria-hidden />
          <span className="text-[13px] text-idl-muted">{t('catalog.activeFilters')}</span>
          {activeFilters.map((filter) => {
            const label = translateActiveFilterLabel(filter, t)
            return (
              <span
                key={filter.key}
                className="inline-flex items-center gap-1.5 rounded-[30px] border border-idl-tech-border bg-idl-tech-panel px-3 py-1.5 text-[12.5px] text-idl-graphite-2"
              >
                {label}
                <button
                  type="button"
                  onClick={() => onRemoveFilter(filter.key)}
                  className="text-idl-amber"
                  aria-label={tParams('catalog.removeFilterAria', { label })}
                >
                  ✕
                </button>
              </span>
            )
          })}
          <button
            type="button"
            onClick={onResetFilters}
            className="text-[12.5px] text-idl-muted hover:text-idl-ink"
          >
            {t('catalog.removeAllFilters')}
          </button>
        </>
      ) : null}

      <div className="relative ml-auto hidden w-auto lg:block">
        <label className="sr-only" htmlFor="catalog-sort">
          {t('catalog.sortResults')}
        </label>
        <select
          id="catalog-sort"
          value={sort}
          onChange={(e) => onSelectSort(e.target.value as CatalogSort)}
          className={cn(
            'rounded-lg border border-idl-tech-border bg-idl-tech-panel px-3.5 py-2 text-[13.5px] font-semibold text-idl-ink',
          )}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {t('catalog.sortLabel')} {t(SORT_LABEL_KEYS[option])}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
