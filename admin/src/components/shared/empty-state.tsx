import type { LucideIcon } from 'lucide-react'
import { InboxIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type EmptyStateProps = {
  title?: string
  description?: string
  icon?: LucideIcon
  className?: string
  children?: React.ReactNode
}

export function EmptyState({
  title,
  description,
  icon: Icon = InboxIcon,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50/80 px-4 py-10 text-center sm:px-6 sm:py-12',
        className,
      )}
    >
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-gray-100">
        <Icon className="h-5 w-5 text-gray-400" aria-hidden />
      </div>
      {title ? <p className="text-sm font-medium text-gray-900">{title}</p> : null}
      {description ? (
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      ) : (
        <p className="text-sm text-gray-500">Nessun elemento da mostrare.</p>
      )}
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  )
}
