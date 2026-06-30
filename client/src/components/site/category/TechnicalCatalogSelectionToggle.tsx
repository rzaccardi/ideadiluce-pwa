'use client'

import { cn } from '@/utils/cn'

type Props = {
  enabled: boolean
  onChange: (enabled: boolean) => void
  className?: string
}

export function TechnicalCatalogSelectionToggle({ enabled, onChange, className }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={cn(
        'inline-flex items-center gap-2 text-[13px] text-idl-muted transition hover:text-idl-ink',
        className,
      )}
    >
      <span
        className={cn(
          'relative inline-block h-[18px] w-[34px] rounded-full transition-colors',
          enabled ? 'bg-idl-amber' : 'bg-idl-tech-chip-border',
        )}
        aria-hidden
      >
        <span
          className={cn(
            'absolute top-0.5 size-3.5 rounded-full bg-white transition-transform',
            enabled ? 'right-0.5' : 'left-0.5',
          )}
        />
      </span>
      <span className="font-medium">Confronta</span>
    </button>
  )
}
