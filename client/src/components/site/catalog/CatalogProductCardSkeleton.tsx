import { Skeleton } from '@/components/Skeleton'
import { cn } from '@/utils/cn'

type Props = {
  variant: 'design' | 'technical' | 'catalog'
  className?: string
}

export function CatalogProductCardSkeleton({ variant, className }: Props) {
  if (variant === 'technical') {
    return (
      <article
        className={cn(
          'flex h-full flex-col rounded-lg border border-idl-tech-border bg-white p-4 dark:bg-idl-tech-panel',
          className,
        )}
        aria-hidden
      >
        <div className="mb-2 flex items-center justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="size-4 rounded" />
        </div>
        <Skeleton className="mb-3 aspect-square w-full rounded" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-2 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-2/3" />
        <div className="mt-2.5 mb-3 flex gap-1.5">
          <Skeleton className="h-5 w-12 rounded" />
          <Skeleton className="h-5 w-14 rounded" />
        </div>
        <div className="mt-auto flex items-center justify-between">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      </article>
    )
  }

  return (
    <article
      className={cn(
        'flex h-full flex-col overflow-hidden rounded border border-idl-path-design-border bg-white dark:bg-idl-tech-panel',
        variant === 'catalog' && 'border-idl-tech-border',
        className,
      )}
      aria-hidden
    >
      <Skeleton className="aspect-[4/5] w-full shrink-0 rounded-none" />
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="mt-2 h-5 w-full" />
        <Skeleton className="mt-1 h-4 w-full" />
        <Skeleton className="mt-1 h-4 w-4/5" />
        <div className="mt-auto flex items-center justify-between pt-3">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-4 w-14" />
        </div>
      </div>
    </article>
  )
}
