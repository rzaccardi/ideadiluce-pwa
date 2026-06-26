import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export type ProductDetailSection = {
  id: string
  title: string
  content: ReactNode
}

type Props = {
  sections: ProductDetailSection[]
  className?: string
}

/** Sezioni prodotto impilate in verticale (stile Amazon), tutto visibile senza tab. */
export function ProductDetailSections({ sections, className }: Props) {
  if (sections.length === 0) return null

  return (
    <div className={cn('border-t border-idl-border-strong', className)} aria-label="Dettagli prodotto">
      {sections.map((section, index) => (
        <section
          key={section.id}
          id={section.id}
          aria-labelledby={`${section.id}-heading`}
          className={cn(
            'scroll-mt-24 py-8 md:py-10',
            index > 0 && 'border-t border-idl-border',
          )}
        >
          <h2
            id={`${section.id}-heading`}
            className="mb-5 text-lg font-semibold tracking-tight text-idl-graphite md:text-xl"
          >
            {section.title}
          </h2>
          {section.content}
        </section>
      ))}
    </div>
  )
}
