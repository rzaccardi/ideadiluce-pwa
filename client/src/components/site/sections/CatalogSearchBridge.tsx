'use client'

import { Reveal } from '@/components/motion'
import { SectionContainer } from '../primitives'
import { CatalogSearchTrigger } from '../catalog/CatalogSearchTrigger'

type Props = {
  title: string
  subtitle: string
  placeholder: string
  ctaLabel: string
  hints: ReadonlyArray<string>
  hintsLabel?: string
}

export function CatalogSearchBridge({
  title,
  subtitle,
  placeholder,
  ctaLabel,
  hints,
  hintsLabel = 'Prova:',
}: Props) {
  return (
    <Reveal className="border-b border-idl-border bg-idl-paper">
      <SectionContainer narrow className="py-10 text-center sm:py-12">
        <h2 className="font-serif text-2xl font-medium text-idl-ink">{title}</h2>
        <p className="mt-1.5 text-[14.5px] text-idl-ink-muted">{subtitle}</p>
        <div className="mt-5">
          <CatalogSearchTrigger
            searchSource="hero"
            variant="design"
            placeholder={placeholder}
            ctaLabel={ctaLabel}
            hints={hints}
            hintsLabel={hintsLabel}
          />
        </div>
      </SectionContainer>
    </Reveal>
  )
}
