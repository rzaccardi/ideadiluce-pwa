import type { CategoryArticlesSection } from '@/types/category-landing'
import { GuideCardSlider } from '@/components/site/sections/GuideCardSlider'
import type { LocalePathFn } from '../sections/types'

type Props = {
  section: CategoryArticlesSection
  lp: LocalePathFn
}

export function CategoryArticlesSection({ section, lp }: Props) {
  return (
    <section className="border-t border-idl-border bg-idl-cream/40 py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-8 max-w-2xl">
          <div className="font-mono text-[10.5px] tracking-widest text-idl-brass uppercase">{section.eyebrow}</div>
          <h2 className="mt-2 font-serif text-2xl font-medium text-idl-ink sm:text-3xl">{section.title}</h2>
          {section.subtitle ? (
            <p className="mt-3 text-[15px] leading-relaxed text-idl-muted">{section.subtitle}</p>
          ) : null}
        </div>
        <GuideCardSlider items={section.items} lp={lp} loop />
      </div>
    </section>
  )
}
