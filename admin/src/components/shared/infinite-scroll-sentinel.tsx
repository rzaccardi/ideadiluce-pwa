import { cn } from '@/lib/utils'

type InfiniteScrollSentinelProps = {
  ref?: React.Ref<HTMLDivElement>
  loading?: boolean
  hasMore?: boolean
  className?: string
}

/** Anchor invisibile per IntersectionObserver; il loading visivo è nelle righe skeleton della tabella. */
export function InfiniteScrollSentinel({
  ref,
  loading,
  hasMore = true,
  className,
}: InfiniteScrollSentinelProps) {
  if (!hasMore && !loading) return null

  return (
    <div
      ref={ref}
      role="status"
      aria-live="polite"
      aria-busy={loading}
      className={cn('h-4 w-full shrink-0', className)}
    >
      <span className="sr-only">
        {loading ? 'Caricamento altri elementi…' : 'Scorri per caricare altri elementi'}
      </span>
    </div>
  )
}
