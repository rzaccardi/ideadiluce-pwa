'use client'

import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export function CheckoutStepBody({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn('idl-step-body', className)}>{children}</div>
}
