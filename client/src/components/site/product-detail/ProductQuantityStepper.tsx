'use client'

import { cn } from '@/utils/cn'

type Props = {
  value: number
  min?: number
  max?: number
  onChange: (value: number) => void
  variant?: 'design' | 'technical'
  className?: string
}

export function ProductQuantityStepper({
  value,
  min = 1,
  max,
  onChange,
  variant = 'design',
  className,
}: Props) {
  const isDesign = variant === 'design'

  function decrement() {
    onChange(Math.max(min, value - 1))
  }

  function increment() {
    const next = value + 1
    onChange(max != null ? Math.min(max, next) : next)
  }

  return (
    <div
      className={cn(
        'flex shrink-0 items-center overflow-hidden rounded-lg border',
        isDesign ? 'border-white/16' : 'border-idl-tech-chip-border',
        className,
      )}
    >
      <button
        type="button"
        onClick={decrement}
        disabled={value <= min}
        aria-label="Diminuisci quantità"
        className={cn(
          'px-4 text-lg leading-[50px] transition disabled:opacity-40',
          isDesign ? 'text-idl-design-muted hover:text-idl-design-fg' : 'text-idl-muted hover:text-idl-graphite',
        )}
      >
        −
      </button>
      <span
        className={cn(
          'w-[34px] text-center text-[15px] font-bold',
          isDesign ? 'text-idl-design-fg' : 'text-idl-graphite',
        )}
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        onClick={increment}
        disabled={max != null && value >= max}
        aria-label="Aumenta quantità"
        className={cn(
          'px-4 text-lg leading-[50px] transition disabled:opacity-40',
          isDesign ? 'text-idl-design-muted hover:text-idl-design-fg' : 'text-idl-muted hover:text-idl-graphite',
        )}
      >
        +
      </button>
    </div>
  )
}
