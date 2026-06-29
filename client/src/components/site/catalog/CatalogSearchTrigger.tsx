'use client'

import { useGlobalSearch } from '@/context/global-search-context'
import { normalizeCatalogSearchHints } from '@/hooks/use-catalog-search-autocomplete'
import type { CatalogSearchSource } from '@/types/catalog-search-events'
import { cn } from '@/utils/cn'
import { ui } from '@/lib/ui-classes'
import type { CatalogSearchFieldVariant } from './CatalogSearchField'

type HintItem = string | { label: string; query: string }

type Props = {
  placeholder: string
  ctaLabel: string
  searchSource?: CatalogSearchSource
  variant?: CatalogSearchFieldVariant
  hints?: ReadonlyArray<HintItem>
  hintsLabel?: string
  showHints?: boolean
  showCta?: boolean
  displayValue?: string
  className?: string
  formClassName?: string
  id?: string
  'aria-label'?: string
}

const VARIANT_STYLES: Record<
  CatalogSearchFieldVariant,
  { form: string; input: string; cta: string }
> = {
  design: {
    form: 'rounded-md border-[1.5px] border-idl-search-border bg-idl-tech-panel p-2 pl-5 shadow-sm',
    input: 'text-base placeholder:text-idl-placeholder',
    cta: cn(ui.ctaInk, 'rounded bg-idl-ink px-7 py-3 text-[15px] font-bold text-white'),
  },
  technical: {
    form: 'rounded-lg border-[1.5px] border-idl-tech-chip-border bg-idl-tech-panel py-2 pl-5 pr-2',
    input: 'text-[15px] placeholder:text-idl-muted',
    cta: cn(ui.ctaAmber, 'rounded-md bg-idl-amber px-6 py-3 text-[14.5px] font-bold text-white'),
  },
  catalog: {
    form: 'rounded-lg border-[1.5px] border-idl-tech-chip-border bg-idl-tech-panel py-2 pl-4 pr-2',
    input: 'text-[15px] placeholder:text-idl-muted',
    cta: cn(ui.ctaInk, 'rounded-md bg-idl-graphite px-5 py-2.5 text-[14px] font-bold text-white'),
  },
  compact: {
    form: 'rounded-lg border border-idl-tech-chip-border bg-idl-tech-panel py-1.5 pl-4 pr-1.5',
    input: 'text-[15px] placeholder:text-idl-muted',
    cta: cn(ui.ctaInk, 'rounded-md bg-idl-graphite px-4 py-2 text-[13px] font-bold text-white'),
  },
}

export function CatalogSearchTrigger({
  placeholder,
  ctaLabel,
  searchSource = 'inline',
  variant = 'design',
  hints,
  hintsLabel = 'Prova:',
  showHints = true,
  showCta = true,
  displayValue,
  className,
  formClassName,
  id,
  'aria-label': ariaLabel,
}: Props) {
  const { openSearch } = useGlobalSearch()
  const styles = VARIANT_STYLES[variant]
  const { display: hintItems } = normalizeCatalogSearchHints(hints)
  const hasValue = Boolean(displayValue?.trim())
  const triggerLabel = ariaLabel ?? placeholder

  return (
    <div className={cn('relative', className)}>
      <div
        role="button"
        tabIndex={0}
        id={id}
        aria-label={triggerLabel}
        onClick={() => openSearch(displayValue, searchSource)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            openSearch(displayValue, searchSource)
          }
        }}
        className={cn(
          'flex w-full cursor-pointer items-center gap-2 text-left',
          styles.form,
          formClassName,
        )}
      >
        <span
          className={cn(
            'min-w-0 flex-1 truncate',
            styles.input,
            hasValue ? 'text-idl-ink' : 'text-idl-placeholder',
          )}
        >
          {hasValue ? displayValue : placeholder}
        </span>
        {showCta ? (
          <span className={cn(styles.cta, 'pointer-events-none shrink-0')}>{ctaLabel}</span>
        ) : null}
      </div>

      {showHints && hintItems.length > 0 ? (
        <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2">
          <span className="text-[12.5px] text-idl-muted">{hintsLabel}</span>
          {hintItems.map((hint) => (
            <button
              key={hint.label}
              type="button"
              onClick={() => openSearch(hint.query, searchSource)}
              className={cn(
                ui.chipInteractive,
                variant === 'technical'
                  ? 'rounded-[30px] border border-idl-tech-chip-border bg-idl-tech-panel px-3 py-1.5 text-[12px] text-idl-graphite-2 hover:border-idl-amber hover:text-idl-amber'
                  : 'rounded-full bg-idl-cream px-3 py-1.5 font-mono text-[12px] text-idl-ink-soft hover:text-idl-ink',
              )}
            >
              {hint.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
