'use client'

import Image from 'next/image'
import { splitHighlightSegments } from '@/lib/catalog-search-highlight'
import { suggestionOptionId } from '@/lib/catalog-search-palette'
import { formatMoney } from '@/lib/format'
import { cn } from '@/utils/cn'
import type { CatalogSearchSuggestion, CatalogSearchSuggestionKind } from '@/lib/catalog-search-suggestions'

export const CATALOG_SEARCH_GROUP_LABEL_KEYS: Record<
  CatalogSearchSuggestionKind,
  | 'catalog.suggestGroupAttacchi'
  | 'catalog.suggestGroupBrands'
  | 'catalog.suggestGroupCategories'
  | 'catalog.suggestGroupProducts'
  | 'catalog.suggestGroupHints'
  | 'catalog.suggestGroupQueries'
> = {
  attacco: 'catalog.suggestGroupAttacchi',
  brand: 'catalog.suggestGroupBrands',
  category: 'catalog.suggestGroupCategories',
  product: 'catalog.suggestGroupProducts',
  hint: 'catalog.suggestGroupHints',
  query: 'catalog.suggestGroupQueries',
}

type HighlightedTextProps = {
  text: string
  query: string
  className?: string
  highlightClassName?: string
}

export function HighlightedText({
  text,
  query,
  className,
  highlightClassName = 'rounded-sm bg-idl-amber/25 font-semibold text-idl-ink',
}: HighlightedTextProps) {
  const segments = splitHighlightSegments(text, query)
  return (
    <span className={className}>
      {segments.map((segment, index) =>
        segment.highlight ? (
          <mark key={`${segment.text}-${index}`} className={highlightClassName}>
            {segment.text}
          </mark>
        ) : (
          <span key={`${segment.text}-${index}`}>{segment.text}</span>
        ),
      )}
    </span>
  )
}

function SuggestionKindIcon({ kind, isRecent }: { kind: CatalogSearchSuggestionKind; isRecent?: boolean }) {
  const iconClass = 'size-4'
  if (isRecent || kind === 'query') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden className={iconClass} fill="none">
        <path
          d="M12 8v5l3 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    )
  }
  if (kind === 'product') return null
  if (kind === 'brand') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden className={iconClass} fill="none">
        <path d="M4 7h16M7 7v13M17 7v13M4 20h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  }
  if (kind === 'category') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden className={iconClass} fill="none">
        <path d="M4 6h7v7H4zM13 6h7v4h-7zM13 12h7v7h-7zM4 15h7v4H4z" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    )
  }
  if (kind === 'attacco') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden className={iconClass} fill="none">
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={iconClass} fill="none">
      <path
        d="M9.5 9.5a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0zM5 19c0-2.8 3.1-4 7-4s7 1.2 7 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

type SuggestionRowProps = {
  item: CatalogSearchSuggestion
  query: string
  active?: boolean
  variant?: 'dropdown' | 'palette'
  listId?: string
  isRecent?: boolean
  onPick: (item: CatalogSearchSuggestion) => void
  onHover?: () => void
}

export function CatalogSearchSuggestionRow({
  item,
  query,
  active = false,
  variant = 'dropdown',
  listId,
  isRecent = false,
  onPick,
  onHover,
}: SuggestionRowProps) {
  const isProduct = item.kind === 'product'
  const product = item.product
  const optionId = listId ? suggestionOptionId(listId, item.id) : undefined

  if (variant === 'palette' && isProduct) {
    return (
      <button
        id={optionId}
        type="button"
        role="option"
        aria-selected={active}
        data-active={active || undefined}
        className={cn(
          'flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors',
          active ? 'bg-idl-cream' : 'hover:bg-idl-cream/80',
        )}
        onMouseDown={(event) => {
          event.preventDefault()
          onPick(item)
        }}
        onMouseEnter={onHover}
      >
        <div className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-idl-border bg-idl-cream">
          {product?.imageUrl ? (
            <Image src={product.imageUrl} alt="" fill sizes="48px" className="object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-[10px] font-mono text-idl-muted">
              IDL
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="line-clamp-1 text-[14px] font-medium text-idl-ink">
            <HighlightedText text={item.label} query={query} />
          </div>
          {item.sublabel ? (
            <div className="line-clamp-1 text-[12px] text-idl-muted">
              <HighlightedText text={item.sublabel} query={query} highlightClassName="text-idl-ink-soft" />
            </div>
          ) : null}
        </div>
        {product?.priceCents != null ? (
          <div className="shrink-0 text-right text-[13px] font-semibold tabular-nums text-idl-ink">
            {formatMoney(product.priceCents, product.currency ?? 'EUR')}
          </div>
        ) : null}
      </button>
    )
  }

  if (variant === 'palette') {
    return (
      <button
        id={optionId}
        type="button"
        role="option"
        aria-selected={active}
        data-active={active || undefined}
        className={cn(
          'flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors',
          active ? 'bg-idl-cream' : 'hover:bg-idl-cream/80',
        )}
        onMouseDown={(event) => {
          event.preventDefault()
          onPick(item)
        }}
        onMouseEnter={onHover}
      >
        <div
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-lg border border-idl-border bg-idl-tech-panel text-idl-muted',
            active && 'border-idl-brass/40 text-idl-brass',
          )}
        >
          <SuggestionKindIcon kind={item.kind} isRecent={isRecent} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="line-clamp-1 text-[14px] font-medium text-idl-ink">
            <HighlightedText text={item.label} query={query} />
          </div>
          {item.sublabel ? (
            <div className="line-clamp-1 text-[12px] text-idl-muted">
              <HighlightedText text={item.sublabel} query={query} highlightClassName="text-idl-ink-soft" />
            </div>
          ) : null}
        </div>
      </button>
    )
  }

  return (
    <button
      id={optionId}
      type="button"
      role="option"
      aria-selected={active}
      className={cn(
        'flex w-full flex-col gap-0.5 px-3 py-2.5 text-left transition hover:bg-idl-cream',
        active && 'bg-idl-cream',
      )}
      onMouseDown={(event) => {
        event.preventDefault()
        onPick(item)
      }}
      onMouseEnter={onHover}
    >
      <span className="text-[14px] font-medium text-idl-ink">
        <HighlightedText text={item.label} query={query} />
      </span>
      {item.sublabel ? (
        <span className="line-clamp-1 text-[12px] text-idl-muted">
          <HighlightedText text={item.sublabel} query={query} highlightClassName="text-idl-ink-soft" />
        </span>
      ) : null}
    </button>
  )
}

export function CatalogSearchSuggestionSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-1 px-2 py-2" aria-hidden>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="flex items-center gap-3 px-2 py-2.5">
          <div className="size-12 animate-pulse rounded-lg bg-idl-cream" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-3/4 animate-pulse rounded bg-idl-cream" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-idl-cream" />
          </div>
          <div className="h-3.5 w-14 animate-pulse rounded bg-idl-cream" />
        </div>
      ))}
    </div>
  )
}

export function CatalogSearchInputSpinner({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={cn('size-4 animate-spin text-idl-muted', className)}
      fill="none"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2.5" />
      <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}
