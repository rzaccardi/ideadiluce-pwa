import { EmptyState } from './empty-state'
import { InfiniteScrollSentinel } from './infinite-scroll-sentinel'
import { TableSkeleton, TableSkeletonRows } from './table-skeleton'
import {
  Table,
  TableBody,
  TableHeader,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

type InfiniteScrollTableZoneProps = {
  columns: string[]
  columnCount: number
  initialLoading: boolean
  loading: boolean
  loadingMore: boolean
  hasMore: boolean
  /** Lista già risolta dal server (anche se vuota). */
  listReady: boolean
  itemsLength: number
  sentinelRef?: React.Ref<HTMLDivElement>
  leadingMediaColumn?: boolean
  emptyTitle?: string
  emptyDescription?: string
  tableHeader: React.ReactNode
  children: React.ReactNode
  className?: string
}

/**
 * Shell tabella lista admin: skeleton iniziale, bordo, righe skeleton in append, sentinel.
 * Stesso layout per Product Hub e Ordini.
 */
export function InfiniteScrollTableZone({
  columns,
  columnCount,
  initialLoading,
  loading,
  loadingMore,
  hasMore,
  listReady,
  itemsLength,
  sentinelRef,
  leadingMediaColumn,
  emptyTitle = 'Nessun elemento',
  emptyDescription = 'Nessun risultato con i filtri selezionati.',
  tableHeader,
  children,
  className,
}: InfiniteScrollTableZoneProps) {
  if (initialLoading) {
    return (
      <TableSkeleton
        columns={columns}
        bordered
        leadingMediaColumn={leadingMediaColumn}
        className={className}
      />
    )
  }

  if (itemsLength > 0) {
    return (
      <div className={cn('overflow-x-auto rounded-md border', className)}>
        <Table>
          <TableHeader>{tableHeader}</TableHeader>
          <TableBody>
            {children}
            {loadingMore ? (
              <TableSkeletonRows
                columnCount={columnCount}
                rows={4}
                leadingMediaColumn={leadingMediaColumn}
              />
            ) : null}
          </TableBody>
        </Table>
        <InfiniteScrollSentinel ref={sentinelRef} loading={loadingMore} hasMore={hasMore} />
      </div>
    )
  }

  if (listReady && !loading) {
    return (
      <EmptyState title={emptyTitle} description={emptyDescription} className={className} />
    )
  }

  if (loading) {
    return (
      <TableSkeleton
        columns={columns}
        bordered
        leadingMediaColumn={leadingMediaColumn}
        className={className}
      />
    )
  }

  return null
}
