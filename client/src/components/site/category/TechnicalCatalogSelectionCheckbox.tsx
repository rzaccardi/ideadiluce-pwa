'use client'

import { cn } from '@/utils/cn'

type Props = {
  checked: boolean
  disabled?: boolean
  onChange: () => void
  productName: string
  className?: string
}

export function TechnicalCatalogSelectionCheckbox({
  checked,
  disabled = false,
  onChange,
  productName,
  className,
}: Props) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={checked ? `Deseleziona ${productName}` : `Seleziona ${productName}`}
      disabled={disabled}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onChange()
      }}
      className={cn(
        'flex size-4 shrink-0 items-center justify-center rounded border-[1.5px] text-[11px] transition',
        checked
          ? 'border-idl-amber bg-idl-amber text-white'
          : 'border-idl-tech-chip-border bg-white text-transparent',
        disabled && !checked && 'cursor-not-allowed opacity-40',
        className,
      )}
    >
      {checked ? '✓' : null}
    </button>
  )
}
