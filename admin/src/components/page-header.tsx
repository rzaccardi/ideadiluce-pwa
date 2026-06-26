import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type PageHeaderProps = {
  title: string
  description?: string
  icon?: LucideIcon
  iconBoxClassName?: string
  iconClassName?: string
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  iconBoxClassName,
  iconClassName,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between',
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        {Icon ? (
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 sm:h-11 sm:w-11',
              iconBoxClassName,
            )}
          >
            <Icon className={cn('h-5 w-5 text-primary', iconClassName)} aria-hidden />
          </div>
        ) : null}
        <div className="min-w-0 flex flex-col gap-1">
          <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">{title}</h1>
          {description ? (
            <p className="text-sm leading-relaxed text-gray-500">{description}</p>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          {actions}
        </div>
      ) : null}
    </div>
  )
}
