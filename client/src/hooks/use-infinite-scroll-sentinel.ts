import { useEffect, useRef } from 'react'

type Options = {
  enabled?: boolean
  hasMore?: boolean
  loading?: boolean
  onLoadMore: () => void
  rootMargin?: string
}

export function useInfiniteScrollSentinel({
  enabled = true,
  hasMore = false,
  loading = false,
  onLoadMore,
  rootMargin = '360px',
}: Options) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!enabled || !hasMore || loading) return
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMore()
      },
      { rootMargin },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [enabled, hasMore, loading, onLoadMore, rootMargin])

  return ref
}
