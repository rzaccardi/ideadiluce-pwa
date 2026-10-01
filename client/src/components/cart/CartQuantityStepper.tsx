'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/utils/cn'

type Props = {
  value: number
  min?: number
  max?: number
  maxHint?: string
  disabled?: boolean
  onChange: (next: number) => void
  className?: string
}

export function CartQuantityStepper({
  value,
  min = 1,
  max,
  maxHint,
  disabled = false,
  onChange,
  className,
}: Props) {
  const [draft, setDraft] = useState(value)
  const atMax = max != null && draft >= max

  useEffect(() => {
    setDraft(value)
  }, [value])

  function commit(next: number) {
    let clamped = Math.max(min, next)
    if (max != null) clamped = Math.min(max, clamped)
    setDraft(clamped)
    if (clamped !== value) onChange(clamped)
  }

  return (
    <div
      className={cn(
        'inline-flex items-center overflow-hidden rounded-lg border border-idl-tech-chip-border',
        disabled && 'opacity-60',
        className,
      )}
    >
      <button
        type="button"
        disabled={disabled || draft <= min}
        onClick={() => commit(draft - 1)}
        className="flex h-[34px] w-8 items-center justify-center text-[17px] text-idl-muted transition hover:bg-idl-tech-panel disabled:cursor-not-allowed"
        aria-label="Diminuisci quantità"
      >
        −
      </button>
      <span className="w-[34px] text-center text-sm font-bold tabular-nums text-idl-graphite">
        {draft}
      </span>
      <button
        type="button"
        disabled={disabled || atMax}
        title={atMax && maxHint ? maxHint : undefined}
        aria-label={atMax && maxHint ? maxHint : 'Aumenta quantità'}
        onClick={() => commit(draft + 1)}
        className="flex h-[34px] w-8 items-center justify-center text-[17px] text-idl-muted transition hover:bg-idl-tech-panel disabled:cursor-not-allowed"
      >
        +
      </button>
    </div>
  )
}
