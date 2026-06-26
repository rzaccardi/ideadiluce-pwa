import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

/** Card su sfondo zinc-50 — come le sezioni della thank you page. */
export function AccountCard({
  children,
  className,
  padding = true,
}: {
  children: ReactNode
  className?: string
  padding?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-md border border-zinc-200 bg-white',
        padding && 'p-4 sm:p-5',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function AccountCardTitle({
  children,
  action,
}: {
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-base font-medium text-zinc-900">{children}</h2>
      {action}
    </div>
  )
}
