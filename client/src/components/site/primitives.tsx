import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

/** Padding orizzontale pagine storefront: 16px mobile, 32px tablet, 48px desktop. */
export const SITE_PAGE_X_CLASS = 'px-4 md:px-8 lg:px-12'

export function SectionContainer({
  children,
  className,
  narrow,
}: {
  children: ReactNode
  className?: string
  narrow?: boolean
}) {
  return (
    <div
      className={cn(
        'mx-auto w-full',
        SITE_PAGE_X_CLASS,
        narrow ? 'max-w-[1000px]' : 'max-w-[1320px]',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function Eyebrow({
  children,
  variant = 'design',
  className,
}: {
  children: ReactNode
  variant?: 'design' | 'technical' | 'neutral'
  className?: string
}) {
  return (
    <div
      className={cn(
        'font-mono text-[11px] font-medium tracking-[0.22em] uppercase',
        variant === 'design' && 'text-idl-glow',
        variant === 'technical' && 'text-idl-amber',
        variant === 'neutral' && 'text-idl-brass',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function BrandWordmark({
  className,
  accentClassName,
}: {
  className?: string
  accentClassName?: string
}) {
  return (
    <span className={cn('font-serif text-[25px] font-semibold tracking-[0.005em] text-idl-ink', className)}>
      Idea<span className={cn('italic text-idl-brass', accentClassName)}>di</span>Luce
    </span>
  )
}
