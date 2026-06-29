import type { CategoryTipsSection } from '@/types/category-landing'
import { SectionContainer } from '../primitives'

type Props = {
  section: CategoryTipsSection
}

export function CategoryTipsSection({ section }: Props) {
  return (
    <section className="border-t border-idl-tech-border bg-idl-tech-panel">
      <SectionContainer className="py-8 sm:py-12">
        <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">{section.title}</h2>
        <p className="mt-2 max-w-3xl text-[14px] text-idl-muted sm:text-[14.5px]">{section.subtitle}</p>
        <div className="mt-5 grid gap-3 sm:mt-6 sm:gap-4 lg:grid-cols-3">
          {section.cards.map((card) => (
            <div key={card.title} className="rounded-lg border border-idl-tech-border bg-idl-tech-panel p-4 sm:p-6">
              <div className="font-mono text-[11px] tracking-[0.1em] text-idl-amber uppercase">{card.eyebrow}</div>
              <h3 className="mt-3 text-base font-bold">{card.title}</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-idl-muted">{card.description}</p>
            </div>
          ))}
        </div>
      </SectionContainer>
    </section>
  )
}
