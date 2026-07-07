import type { CategoryGuideSection } from '@/types/category-landing'
import { SectionContainer } from '../primitives'

type Props = {
  section: CategoryGuideSection
}

export function CategoryGuideSection({ section }: Props) {
  return (
    <section className="border-t border-idl-border bg-idl-paper">
      <SectionContainer className="grid gap-8 py-8 sm:gap-10 sm:py-12 lg:grid-cols-2 lg:items-start">
        <div>
          <div className="font-mono text-[11px] tracking-[0.22em] text-idl-brass uppercase">{section.eyebrow}</div>
          <h2 className="mt-3 font-serif text-[24px] font-medium text-idl-ink sm:text-[28px]">{section.title}</h2>
          <p className="mt-3 text-[14.5px] leading-relaxed text-idl-ink-muted sm:text-[15px]">{section.description}</p>
        </div>
        <div>
          {section.faq.map((item) => (
            <div
              key={item.question}
              className="flex items-start justify-between gap-3 border-b border-idl-border py-4 first:pt-0 sm:items-center sm:gap-4"
            >
              <h3 className="min-w-0 text-[14.5px] font-semibold text-idl-ink sm:text-[15px]">{item.question}</h3>
              <span className="shrink-0 text-lg text-idl-brass">+</span>
            </div>
          ))}
        </div>
      </SectionContainer>
    </section>
  )
}
