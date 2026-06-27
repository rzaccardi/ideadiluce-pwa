'use client'

import { useState, type FormEvent } from 'react'
import { useNavigate } from '@/lib/navigation'
import { SectionContainer } from '../primitives'
import { Reveal } from '@/components/motion'
import { ui } from '@/lib/ui-classes'
import { cn } from '@/utils/cn'
import type { LocalePathFn } from './types'

type Props = {
  title: string
  subtitle: string
  placeholder: string
  ctaLabel: string
  hints: ReadonlyArray<string>
  hintsLabel?: string
  lp: LocalePathFn
}

export function CatalogSearchBridge({
  title,
  subtitle,
  placeholder,
  ctaLabel,
  hints,
  hintsLabel = 'Prova:',
  lp,
}: Props) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  function goToCatalog(q: string) {
    const trimmed = q.trim()
    navigate(trimmed ? `${lp('/catalogo')}?q=${encodeURIComponent(trimmed)}` : lp('/catalogo'))
  }

  function onSearch(e: FormEvent) {
    e.preventDefault()
    goToCatalog(query)
  }

  return (
    <Reveal className="border-b border-idl-border bg-idl-paper">
      <SectionContainer narrow className="py-10 text-center sm:py-12">
        <h2 className="font-serif text-2xl font-medium text-idl-ink">{title}</h2>
        <p className="mt-1.5 text-[14.5px] text-idl-ink-muted">{subtitle}</p>
        <form
          onSubmit={onSearch}
          className="mt-5 flex items-center gap-2 rounded-md border-[1.5px] border-idl-search-border bg-white p-2 pl-5 shadow-sm"
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="min-w-0 flex-1 bg-transparent text-left text-base outline-none placeholder:text-idl-placeholder"
          />
          <button type="submit" className={cn(ui.ctaInk, 'shrink-0 rounded bg-idl-ink px-7 py-3 text-[15px] font-bold text-white')}>
            {ctaLabel}
          </button>
        </form>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <span className="text-[13px] text-idl-ink-muted">{hintsLabel}</span>
          {hints.map((hint) => (
            <button
              key={hint}
              type="button"
              onClick={() => {
                setQuery(hint)
                goToCatalog(hint)
              }}
              className={cn(ui.chipInteractive, 'rounded-full bg-idl-cream px-3 py-1.5 font-mono text-[12px] text-idl-ink-soft hover:text-idl-ink')}
            >
              {hint}
            </button>
          ))}
        </div>
      </SectionContainer>
    </Reveal>
  )
}
