import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

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
        'mx-auto w-full px-4 sm:px-6 lg:px-12',
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

export function BrandWordmark({ className }: { className?: string }) {
  return (
    <span className={cn('font-serif text-[25px] font-semibold tracking-[0.005em] text-idl-ink', className)}>
      Idea<span className="italic text-idl-brass">di</span>Luce
    </span>
  )
}
