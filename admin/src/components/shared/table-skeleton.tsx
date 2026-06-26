import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

type TableSkeletonProps = {
  columns: string[]
  rows?: number
  bordered?: boolean
  className?: string
}

/** Righe skeleton da appendere in TableBody durante infinite scroll. */
export function TableSkeletonRows({
  columnCount,
  rows = 3,
  className,
  leadingMediaColumn,
}: {
  columnCount: number
  rows?: number
  className?: string
  /** Prima colonna = thumbnail (es. catalogo prodotti). */
  leadingMediaColumn?: boolean
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={`skel-${i}`} className={className} aria-hidden>
          {Array.from({ length: columnCount }).map((_, j) => (
            <TableCell key={j} className="px-3 py-3 sm:p-4">
              {leadingMediaColumn && j === 0 ? (
                <Skeleton className="size-10 rounded-md" />
              ) : (
                <Skeleton
                  className={cn('h-5 max-w-xs', j === columnCount - 1 ? 'ml-auto w-12' : 'w-[88%]')}
                />
              )}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

export function TableSkeleton({
  columns,
  rows = 5,
  bordered,
  className,
  leadingMediaColumn,
}: TableSkeletonProps & { leadingMediaColumn?: boolean }) {
  const table = (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/50 hover:bg-muted/50">
          {columns.map((col) => (
            <TableHead
              key={col}
              className="h-11 text-xs font-medium text-muted-foreground sm:h-12 sm:text-sm"
            >
              {col || '\u00a0'}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableSkeletonRows
          columnCount={columns.length}
          rows={rows}
          leadingMediaColumn={leadingMediaColumn}
        />
      </TableBody>
    </Table>
  )

  if (bordered) {
    return (
      <div className={cn('scroll-x-touch rounded-md border', className)} aria-busy="true">
        {table}
      </div>
    )
  }

  return (
    <div className={cn('scroll-x-touch', className)} aria-busy="true">
      {table}
    </div>
  )
}
