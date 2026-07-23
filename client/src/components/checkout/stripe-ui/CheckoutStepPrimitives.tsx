'use client'

import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

/** Titolo + sottotitolo step come nel mock checkout. */
export function CheckoutStepHeader({
  title,
  subtitle,
  className,
}: {
  title?: string
  subtitle?: string
  className?: string
}) {
  if (!title && !subtitle) return null

  return (
    <header className={cn('mb-5', className)}>
      {title ? (
        <h2 className="text-lg font-extrabold tracking-[-0.01em] text-idl-graphite sm:text-[20px]">
          {title}
        </h2>
      ) : null}
      {subtitle ? (
        <p className={cn('text-sm leading-relaxed text-idl-muted', title ? 'mt-1' : undefined)}>
          {subtitle}
        </p>
      ) : null}
    </header>
  )
}

/** Pannello con bordo (es. indirizzo diverso, dati azienda). */
export function CheckoutPanel({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('rounded-[14px] border border-[#e7eaee] p-4 sm:p-5', className)}>{children}</div>
  )
}

/** Nota informativa con icona (es. IVA / corriere). */
export function CheckoutInfoNote({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-2.5 rounded-[11px] border border-[#ededea] bg-idl-tech-panel px-[15px] py-3.5">
      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center text-idl-ink" aria-hidden>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.25" />
          <path d="M8 7v4M8 5.5v0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </span>
      <p className="text-[12.5px] leading-relaxed text-idl-muted">{children}</p>
    </div>
  )
}

/** Card riepilogo ordine (step pagamento). */
export function CheckoutReviewCard({
  title,
  children,
  className,
}: {
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('rounded-xl border border-[#e7eaee] px-4 py-4 sm:px-5 sm:py-[18px]', className)}>
      <h3 className="mb-3 text-[13px] font-extrabold text-idl-graphite">{title}</h3>
      <div className="space-y-1">{children}</div>
    </section>
  )
}

export function CheckoutReviewRow({
  label,
  value,
  strong,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-0.5 text-[13px] text-[#5b616b]">
      <span>{label}</span>
      <span className={cn('text-right', strong ? 'font-extrabold text-idl-graphite' : 'font-semibold text-idl-graphite')}>
        {value}
      </span>
    </div>
  )
}

/** Toggle stile mock (checkbox quadrato con spunta). */
export function CheckoutToggleCheckbox({
  checked,
  onChange,
  label,
  className,
  disabled = false,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  className?: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'flex w-full items-start gap-2.5 bg-transparent p-0 text-left text-[13.5px] text-[#3f4651]',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      <span
        className={cn(
          'mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border-[1.5px] text-[11px] text-white',
          checked ? 'border-[#14161b] bg-[#14161b]' : 'border-[#c0c5cc] bg-idl-tech-panel',
        )}
        aria-hidden
      >
        {checked ? '✓' : null}
      </span>
      <span>{label}</span>
    </button>
  )
}

/** Eyebrow label (es. DATI DI FATTURAZIONE). */
export function CheckoutEyebrowLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-[#8b919b]">
      {children}
    </p>
  )
}

/** Card selezionabile con radio dot — spedizione / pagamento. */
export function CheckoutSelectableCard({
  selected,
  disabled,
  onSelect,
  children,
  className,
  as: Component = 'button',
}: {
  selected: boolean
  disabled?: boolean
  onSelect: () => void
  children: ReactNode
  className?: string
  as?: 'button' | 'label'
}) {
  const shared = cn(
    'flex w-full cursor-pointer items-center gap-3.5 rounded-xl border-[1.5px] p-4 text-left transition sm:gap-[15px] sm:px-[18px] sm:py-4',
    selected
      ? 'border-[#14161b] bg-[#f4f5f7] shadow-[0_0_0_3px_rgba(120, 120, 125,0.18)]'
      : 'border-idl-tech-border bg-idl-tech-panel hover:border-[#c0c5cc]',
    disabled && 'pointer-events-none opacity-60',
    className,
  )

  const dot = (
    <span
      className={cn(
        'flex size-[18px] shrink-0 items-center justify-center rounded-full border-[5px] bg-idl-tech-panel',
        selected ? 'border-[#14161b]' : 'border-[#c0c5cc]',
      )}
      aria-hidden
    />
  )

  if (Component === 'label') {
    return (
      <label className={shared}>
        <input type="radio" className="sr-only" checked={selected} disabled={disabled} onChange={onSelect} />
        {dot}
        <div className="min-w-0 flex-1">{children}</div>
      </label>
    )
  }

  return (
    <button type="button" disabled={disabled} onClick={onSelect} className={shared}>
      {dot}
      <div className="min-w-0 flex-1">{children}</div>
    </button>
  )
}

/** Segment control (Privato / Azienda, destinatario). */
export function CheckoutSegmentControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: Array<{ value: T; label: string }>
  onChange: (value: T) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-xl border border-idl-tech-border bg-idl-tech-panel p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-[10px] px-2 py-2.5 text-xs font-bold leading-tight transition sm:px-3 sm:text-sm',
            value === option.value
              ? 'bg-[#0c0c0d] text-white shadow-[0_2px_8px_rgba(12,12,13,0.25)]'
              : 'text-idl-muted hover:bg-white/80 hover:text-idl-graphite',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
