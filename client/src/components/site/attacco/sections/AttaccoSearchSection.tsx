'use client'

import { useState, type FormEvent } from 'react'
import { useNavigate } from '@/lib/navigation'
import { SectionContainer } from '../../primitives'
import { ATTACCO_SEARCH } from '@/lib/attacco.defaults'
import { ui } from '@/lib/ui-classes'
import { cn } from '@/utils/cn'
import type { LocalePathFn } from '../../sections/types'

type Props = {
  lp: LocalePathFn
}

export function AttaccoSearchSection({ lp }: Props) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  function goToCatalog(q: string) {
    const trimmed = q.trim()
    const base = lp('/catalog?world=technical')
    navigate(trimmed ? `${base}&q=${encodeURIComponent(trimmed)}` : base)
  }

  function onSearch(e: FormEvent) {
    e.preventDefault()
    goToCatalog(query)
  }

  return (
    <section className="border-b border-idl-tech-border bg-idl-path-tech">
      <SectionContainer className="py-6 sm:py-6">
        <form
          onSubmit={onSearch}
          className="mx-auto flex max-w-[780px] items-center gap-2.5 rounded-lg border-[1.5px] border-idl-tech-chip-border bg-white py-2 pl-5 pr-2"
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={ATTACCO_SEARCH.placeholder}
            className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-idl-muted"
          />
          <button type="submit" className={cn(ui.ctaAmber, 'shrink-0 rounded-md bg-idl-amber px-6 py-3 text-[14.5px] font-bold text-white')}>
            {ATTACCO_SEARCH.ctaLabel}
          </button>
        </form>
        <div className="mx-auto mt-3.5 flex max-w-[900px] flex-wrap items-center justify-center gap-2">
          <span className="text-[12.5px] text-idl-muted">{ATTACCO_SEARCH.hintsLabel}</span>
          {ATTACCO_SEARCH.hints.map((hint) => (
            <button
              key={hint.label}
              type="button"
              onClick={() => {
                setQuery(hint.query)
                goToCatalog(hint.query)
              }}
              className={cn(ui.chipInteractive, 'rounded-[30px] border border-idl-tech-chip-border bg-white px-3 py-1.5 text-[12px] text-idl-graphite-2 hover:border-idl-amber hover:text-idl-amber')}
            >
              {hint.label}
            </button>
          ))}
        </div>
      </SectionContainer>
    </section>
  )
}
