'use client'

import { SectionContainer } from '../../primitives'
import { CatalogSearchTrigger } from '@/components/site/catalog/CatalogSearchTrigger'
import { ATTACCO_SEARCH } from '@/lib/attacco.defaults'

export function AttaccoSearchSection() {
  return (
    <section className="border-b border-idl-tech-border bg-idl-path-tech">
      <SectionContainer className="py-6 sm:py-6">
        <div className="mx-auto max-w-[780px]">
          <CatalogSearchTrigger
            searchSource="attacco"
            variant="technical"
            placeholder={ATTACCO_SEARCH.placeholder}
            ctaLabel={ATTACCO_SEARCH.ctaLabel}
            hints={ATTACCO_SEARCH.hints}
            hintsLabel={ATTACCO_SEARCH.hintsLabel}
          />
        </div>
      </SectionContainer>
    </section>
  )
}
