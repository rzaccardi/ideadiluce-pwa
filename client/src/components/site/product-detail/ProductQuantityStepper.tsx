'use client'

import { cn } from '@/utils/cn'

type Props = {
  value: number
  min?: number
  max?: number
  /** Tooltip sul "+" disabilitato (edge case stock limitato). */
  maxHint?: string
  onChange: (value: number) => void
  variant?: 'design' | 'technical'
  className?: string
  disabled?: boolean
}

export function ProductQuantityStepper({
  value,
  min = 1,
  max,
  maxHint,
  onChange,
  variant = 'design',
  className,
  disabled = false,
}: Props) {
  const isDesign = variant === 'design'
  const atMax = max != null && value >= max
  const incrementDisabled = disabled || atMax

  function decrement() {
    if (disabled) return
    onChange(Math.max(min, value - 1))
  }

  function increment() {
    if (incrementDisabled) return
    const next = value + 1
    onChange(max != null ? Math.min(max, next) : next)
  }

  return (
    <div
      className={cn(
        'flex shrink-0 items-center overflow-hidden rounded-lg border',
        isDesign ? 'border-idl-path-design-border' : 'border-idl-tech-chip-border',
        disabled && 'opacity-60',
        className,
      )}
    >
      <button
        type="button"
        onClick={decrement}
        disabled={disabled || value <= min}
        aria-label="Diminuisci quantità"
        className={cn(
          'px-4 text-lg leading-[50px] transition disabled:opacity-40',
          isDesign ? 'text-idl-ink-muted hover:text-idl-ink' : 'text-idl-muted hover:text-idl-graphite',
        )}
      >
        −
      </button>
      <span
        className={cn(
          'w-[34px] text-center text-[15px] font-bold',
          isDesign ? 'text-idl-ink' : 'text-idl-graphite',
        )}
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        onClick={increment}
        disabled={incrementDisabled}
        title={atMax && maxHint ? maxHint : undefined}
        aria-label={atMax && maxHint ? maxHint : 'Aumenta quantità'}
        className={cn(
          'px-4 text-lg leading-[50px] transition disabled:opacity-40',
          isDesign ? 'text-idl-ink-muted hover:text-idl-ink' : 'text-idl-muted hover:text-idl-graphite',
        )}
      >
        +
      </button>
    </div>
  )
}
