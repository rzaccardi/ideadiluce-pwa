'use client'

import { cn } from '@/utils/cn'

type Props = {
  shownProducts: number
  totalProducts: number
  hasMore: boolean
  isLoadingMore: boolean
  onLoadMore: () => void
  loadMoreLabel?: string
  variant?: 'catalog' | 'design' | 'technical'
}

export function CatalogLoadMoreFooter({
  shownProducts,
  totalProducts,
  hasMore,
  isLoadingMore,
  onLoadMore,
  loadMoreLabel = 'Carica altri prodotti',
  variant = 'catalog',
}: Props) {
  const isDesign = variant === 'design'

  return (
    <>
      {hasMore ? (
        <div className={cn('pt-8 text-center', isDesign && 'mt-7 sm:mt-9')}>
          <button
            type="button"
            disabled={isLoadingMore}
            onClick={onLoadMore}
            className={cn(
              'rounded-lg border px-8 py-3.5 text-[14px] font-bold transition disabled:opacity-60',
              isDesign
                ? 'w-full border-idl-path-design-border text-[14.5px] font-semibold text-idl-ink hover:border-idl-brass hover:text-idl-brass sm:w-auto'
                : variant === 'technical'
                  ? 'border-idl-tech-chip-border bg-idl-tech-panel text-idl-ink hover:border-idl-ink'
                  : 'border-idl-tech-chip-border bg-idl-tech-panel text-idl-ink hover:border-idl-ink',
            )}
          >
            {loadMoreLabel}
          </button>
          <p className="mt-2.5 text-xs text-idl-muted">
            {shownProducts} di {totalProducts}
          </p>
        </div>
      ) : totalProducts > 0 ? (
        <p className="pt-8 text-center text-[13.5px] text-idl-muted">
          Hai visto tutti i prodotti di questa selezione.
        </p>
      ) : null}
    </>
  )
}
