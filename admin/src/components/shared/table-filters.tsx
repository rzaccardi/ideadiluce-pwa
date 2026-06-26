import { XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type TableFiltersProps = {
  search?: React.ReactNode
  filters?: React.ReactNode
  onReset?: () => void
  resetLabel?: string
  actions?: React.ReactNode
  className?: string
}

/** Filtri lista: colonna su mobile, riga da md; reset a destra su desktop. */
export function TableFilters({
  search,
  filters,
  onReset,
  resetLabel = 'Reimposta filtri',
  actions,
  className,
}: TableFiltersProps) {
  return (
    <div
      className={cn(
        'mb-4 grid gap-3 sm:gap-4',
        search || filters ? 'sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto]' : '',
        className,
      )}
    >
      {search ? <div className="min-w-0 sm:col-span-2 lg:col-span-1 lg:max-w-sm">{search}</div> : null}
      {filters ? (
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
          {filters}
        </div>
      ) : null}
      <div
        className={cn(
          'flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center',
          search || filters ? 'sm:col-span-2 lg:col-span-1 lg:justify-end' : '',
        )}
      >
        {onReset ? (
          <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto" onClick={onReset}>
            <XIcon className="h-4 w-4" aria-hidden />
            {resetLabel}
          </Button>
        ) : null}
        {actions ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap [&_button]:w-full sm:[&_button]:w-auto">
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  )
}
