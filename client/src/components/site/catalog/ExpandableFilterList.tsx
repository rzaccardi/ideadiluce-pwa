'use client'

import { useState, type ReactNode } from 'react'
import { cn } from '@/utils/cn'

export const FILTER_LIST_INITIAL_VISIBLE = 8
export const FILTER_CHIP_INITIAL_VISIBLE = 12

type Props<T> = {
  items: ReadonlyArray<T>
  initialVisible?: number
  getKey: (item: T) => string
  isSelected?: (item: T) => boolean
  renderItem: (item: T) => ReactNode
  className?: string
  listClassName?: string
  tone?: 'tech' | 'design'
}

export function ExpandableFilterList<T>({
  items,
  initialVisible = FILTER_LIST_INITIAL_VISIBLE,
  getKey,
  isSelected,
  renderItem,
  className,
  listClassName,
  tone = 'tech',
}: Props<T>) {
  const [expanded, setExpanded] = useState(() =>
    isSelected ? items.slice(initialVisible).some(isSelected) : false,
  )

  if (items.length === 0) return null

  const hasMore = items.length > initialVisible
  const visible = expanded || !hasMore ? items : items.slice(0, initialVisible)

  return (
    <div className={className}>
      <div className={listClassName}>
        {visible.map((item) => (
          <div key={getKey(item)} className="contents">
            {renderItem(item)}
          </div>
        ))}
      </div>
      {hasMore ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={cn(
            'mt-2 text-[12.5px] font-semibold',
            tone === 'design' ? 'text-idl-brass' : 'text-idl-amber',
          )}
        >
          {expanded ? 'Mostra meno' : `Mostra tutti (${items.length})`}
        </button>
      ) : null}
    </div>
  )
}
