import { Skeleton } from '@/components/ui/skeleton'
import { TableSkeleton } from './table-skeleton'

type RouteSkeletonVariant = 'default' | 'list' | 'detail' | 'form'

type RouteSkeletonProps = {
  variant?: RouteSkeletonVariant
}

/** Skeleton di pagina admin — layout coerente con lista, dettaglio o form. */
export function RouteSkeleton({ variant = 'default' }: RouteSkeletonProps) {
  if (variant === 'list') {
    return (
      <div aria-busy="true">
        <TableSkeleton
          columns={['Colonna 1', 'Colonna 2', 'Colonna 3', 'Colonna 4']}
          rows={8}
          bordered
        />
      </div>
    )
  }

  if (variant === 'detail') {
    return (
      <div className="space-y-6" aria-busy="true">
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2 rounded-lg border border-gray-200 bg-white p-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-5 w-full" />
            </div>
          ))}
        </div>
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    )
  }

  if (variant === 'form') {
    return (
      <div aria-busy="true">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
          <Skeleton className="mt-6 h-10 w-32" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6" aria-busy="true">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-80 w-full rounded-lg" />
    </div>
  )
}
