'use client'

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useIsClient } from '@/hooks/use-is-client'
import { useI18n } from '@/hooks/use-i18n'
import {
  normalizeCatalogSearchHints,
  useCatalogSearchAutocomplete,
} from '@/hooks/use-catalog-search-autocomplete'
import { cn } from '@/utils/cn'
import { ui } from '@/lib/ui-classes'
import { nextSearchActiveIndex } from '@/lib/catalog-search-palette'
import { CATALOG_SEARCH_LIMITS, sanitizeCatalogSearchInput } from '@/lib/catalog-search-limits'
import type { CategoryDTO } from '@/types/dto'
import type { BrandListItemDTO } from '@/types/site-content'
import type { LocalePathFn } from '../sections/types'
import {
  CATALOG_SEARCH_GROUP_LABEL_KEYS,
  CatalogSearchInputSpinner,
  CatalogSearchSuggestionRow,
} from './CatalogSearchSuggestionViews'

export type CatalogSearchFieldVariant = 'design' | 'technical' | 'catalog' | 'compact'

type HintItem = string | { label: string; query: string }

type Props = {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  placeholder: string
  ctaLabel: string
  variant?: CatalogSearchFieldVariant
  lp: LocalePathFn
  world?: 'technical' | 'design' | 'all'
  hints?: ReadonlyArray<HintItem>
  hintsLabel?: string
  showHints?: boolean
  showCta?: boolean
  autofocus?: boolean
  className?: string
  formClassName?: string
  brands?: ReadonlyArray<BrandListItemDTO>
  categories?: ReadonlyArray<CategoryDTO>
  enableAutocomplete?: boolean
  /** Se impostato, submit non naviga ma delega al parent (es. aggiornamento URL catalogo). */
  onSubmitQuery?: (query: string) => void
  /** Chiamato dopo submit o selezione suggerimento (es. chiudere modale header). */
  onAfterSubmit?: () => void
  id?: string
  'aria-label'?: string
}

type DropdownRect = { top: number; left: number; width: number }

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

export function CatalogSearchField({
  value,
  defaultValue = '',
  onValueChange,
  placeholder,
  ctaLabel,
  variant = 'design',
  lp,
  world = 'all',
  hints,
  hintsLabel = 'Prova:',
  showHints = true,
  showCta = true,
  autofocus = false,
  className,
  formClassName,
  brands = [],
  categories = [],
  enableAutocomplete = true,
  onSubmitQuery,
  onAfterSubmit,
  id: idProp,
  'aria-label': ariaLabel,
}: Props) {
  const { t } = useI18n()
  const isClient = useIsClient()
  const listId = useId()
  const generatedId = useId()
  const inputId = idProp ?? `catalog-search-${generatedId}`
  const rootRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLUListElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [dropdownRect, setDropdownRect] = useState<DropdownRect | null>(null)

  const { display: hintItems } = normalizeCatalogSearchHints(hints)

  const {
    query,
    setQuery,
    open,
    setOpen,
    loading,
    groups,
    flatSuggestions,
    activeIndex,
    setActiveIndex,
    submitQuery,
    pickSuggestion,
    scheduleAutocomplete,
  } = useCatalogSearchAutocomplete({
    value,
    defaultValue,
    onValueChange,
    lp,
    world,
    brands,
    categories,
    hints,
    enableAutocomplete,
    onSubmitQuery,
    onAfterSubmit,
  })

  const styles = VARIANT_STYLES[variant]
  const trimmedQuery = sanitizeCatalogSearchInput(query)

  function updateDropdownRect() {
    const el = inputRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setDropdownRect({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    })
  }

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node
      if (rootRef.current?.contains(target)) return
      if (dropdownRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [setOpen])

  useEffect(() => {
    if (!open) {
      setDropdownRect(null)
      return
    }
    updateDropdownRect()
    window.addEventListener('scroll', updateDropdownRect, true)
    window.addEventListener('resize', updateDropdownRect)
    return () => {
      window.removeEventListener('scroll', updateDropdownRect, true)
      window.removeEventListener('resize', updateDropdownRect)
    }
  }, [open, flatSuggestions.length])

  function onSearch(e: FormEvent) {
    e.preventDefault()
    if (activeIndex >= 0 && flatSuggestions[activeIndex]) {
      pickSuggestion(flatSuggestions[activeIndex]!)
      return
    }
    submitQuery(query)
  }

  const dropdown =
    isClient && open && flatSuggestions.length > 0 && dropdownRect
      ? createPortal(
          <ul
            ref={dropdownRef}
            id={listId}
            role="listbox"
            style={{
              position: 'fixed',
              top: dropdownRect.top,
              left: dropdownRect.left,
              width: dropdownRect.width,
              zIndex: 9999,
            }}
            className="max-h-72 overflow-auto rounded-lg border border-idl-tech-border bg-idl-tech-panel py-1 shadow-lg"
          >
            {groups.map((group) => (
              <li key={group.kind} role="presentation">
                <div className="px-3 py-1.5 font-mono text-[10px] tracking-[0.12em] text-idl-muted uppercase">
                  {t(CATALOG_SEARCH_GROUP_LABEL_KEYS[group.kind])}
                </div>
                {group.items.map((item) => {
                  const index = flatSuggestions.indexOf(item)
                  return (
                    <CatalogSearchSuggestionRow
                      key={item.id}
                      item={item}
                      query={trimmedQuery}
                      active={index === activeIndex}
                      variant="dropdown"
                      onPick={pickSuggestion}
                      onHover={() => setActiveIndex(index)}
                    />
                  )
                })}
              </li>
            ))}
          </ul>,
          document.body,
        )
      : null

  let hintRow: ReactNode = null
  if (showHints && hintItems.length > 0) {
    hintRow = (
      <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2">
        <span className="text-[12.5px] text-idl-muted">{hintsLabel}</span>
        {hintItems.map((hint) => (
          <button
            key={hint.label}
            type="button"
            onClick={() => {
              setQuery(hint.query)
              submitQuery(hint.query)
            }}
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
    )
  }

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <form
        onSubmit={onSearch}
        className={cn('flex items-center gap-2', styles.form, formClassName)}
      >
        <input
          ref={inputRef}
          id={inputId}
          value={query}
          autoFocus={autofocus}
          role={enableAutocomplete ? 'combobox' : undefined}
          aria-expanded={enableAutocomplete ? open : undefined}
          aria-controls={enableAutocomplete ? listId : undefined}
          aria-autocomplete={enableAutocomplete ? 'list' : undefined}
          aria-label={ariaLabel ?? placeholder}
          placeholder={placeholder}
          className={cn('min-w-0 flex-1 bg-transparent text-left outline-none', styles.input)}
          maxLength={CATALOG_SEARCH_LIMITS.maxQueryLength}
          onChange={(e) => {
            const next = sanitizeCatalogSearchInput(e.target.value)
            setQuery(next)
            scheduleAutocomplete(next)
          }}
          onFocus={() => {
            if (enableAutocomplete && flatSuggestions.length > 0) setOpen(true)
          }}
          onKeyDown={(e) => {
            if (!enableAutocomplete || !open || flatSuggestions.length === 0) return
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setActiveIndex((i) => nextSearchActiveIndex(i, flatSuggestions.length, 'down'))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setActiveIndex((i) => nextSearchActiveIndex(i, flatSuggestions.length, 'up'))
            } else if (e.key === 'Escape') {
              setOpen(false)
            }
          }}
        />
        {enableAutocomplete && loading ? <CatalogSearchInputSpinner /> : null}
        {showCta ? (
          <button type="submit" className={cn(styles.cta, 'shrink-0')}>
            {ctaLabel}
          </button>
        ) : null}
      </form>
      {hintRow}
      {dropdown}
    </div>
  )
}
