'use client'

import { cn } from '@/utils/cn'

type Props = {
  className?: string
}

export function CatalogLoadMoreIndicator({ className }: Props) {
  return (
    <div
      className={cn('mt-4 flex justify-center py-6', className)}
      role="status"
      aria-live="polite"
      aria-label="Caricamento prodotti"
    >
      <span className="size-6 animate-spin rounded-full border-2 border-idl-muted border-t-idl-ink" />
    </div>
  )
}
