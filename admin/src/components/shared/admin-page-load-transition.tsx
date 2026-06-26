'use client'

import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type AdminPageLoadTransitionProps = {
  isLoading: boolean
  skeleton: ReactNode
  children: ReactNode
  /** Header visibile solo durante il caricamento (es. RoutePageHeader). */
  loadingHeader?: ReactNode
  className?: string
}

/** Crossfade skeleton → contenuto dopo fetch API (admin, CSS-only). */
export function AdminPageLoadTransition({
  isLoading,
  skeleton,
  children,
  loadingHeader,
  className,
}: AdminPageLoadTransitionProps) {
  if (isLoading) {
    return (
      <div className={className}>
        {loadingHeader}
        {skeleton}
      </div>
    )
  }

  return <div className={cn('admin-content-enter', className)}>{children}</div>
}
