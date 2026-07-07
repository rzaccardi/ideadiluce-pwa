import type { CategoryLandingContent, CategorySupportCard } from '@/types/category-landing'
import { Link } from '@/lib/navigation'
import { Eyebrow, SectionContainer } from '../../primitives'
import { SiteCardHeading } from '../../SiteHeading'
import { CategoryBreadcrumb } from '../CategoryBreadcrumb'
import type { LocalePathFn } from '../../sections/types'

function SupportCard({ card, lp }: { card: CategorySupportCard; lp: LocalePathFn }) {
  return (
    <div className="w-full rounded-[10px] border border-idl-amber/20 bg-idl-paper p-4 sm:p-5 lg:max-w-[340px] lg:shrink-0">
      <SiteCardHeading className="text-[15px] font-extrabold text-idl-ink">{card.title}</SiteCardHeading>
      <p className="mt-1.5 text-[13px] leading-snug text-idl-ink-muted">{card.description}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          to={lp(card.primaryCta.href)}
          className="rounded-md bg-idl-amber px-4 py-2.5 text-[13px] font-bold text-white"
        >
          {card.primaryCta.label}
        </Link>
        <Link
          to={lp(card.secondaryCta.href)}
          className="rounded-md border border-idl-path-design-border bg-idl-tech-panel px-4 py-2 text-[13px] font-bold text-idl-ink"
        >
          {card.secondaryCta.label}
        </Link>
      </div>
    </div>
  )
}

type Props = {
  content: Pick<CategoryLandingContent, 'breadcrumb' | 'eyebrow' | 'title' | 'description' | 'supportCard'>
  lp: LocalePathFn
}

export function TechnicalCategoryHeroSection({ content, lp }: Props) {
  return (
    <section className="border-b border-idl-tech-border bg-idl-tech-panel">
      <SectionContainer className="py-4 pb-6 sm:py-5 sm:pb-7">
        <CategoryBreadcrumb items={content.breadcrumb} lp={lp} variant="technical" />
        <div className="flex flex-col items-stretch justify-between gap-5 sm:gap-6 lg:flex-row lg:items-end">
          <div className="min-w-0 max-w-2xl">
            <Eyebrow variant="technical">{content.eyebrow}</Eyebrow>
            <h1 className="mt-2.5 text-[28px] leading-[1.05] font-extrabold tracking-tight sm:mt-3 sm:text-[32px] lg:text-[38px]">
              {content.title}
            </h1>
            <p className="mt-2 text-[14.5px] leading-relaxed text-idl-muted sm:mt-2.5 sm:text-[15.5px]">
              {content.description}
            </p>
          </div>
          {content.supportCard ? <SupportCard card={content.supportCard} lp={lp} /> : null}
        </div>
      </SectionContainer>
    </section>
  )
}

export function TechnicalCategorySubtypeSection({
  chips,
  lp,
}: {
  chips: NonNullable<CategoryLandingContent['subtypeChips']>
  lp: LocalePathFn
}) {
  return (
    <section className="border-b border-idl-tech-border bg-idl-tech-panel">
      <SectionContainer className="py-3 sm:py-4">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden">
          {chips.map((chip) =>
            chip.href && !chip.active ? (
              <Link
                key={chip.label}
                to={lp(chip.href)}
                className="shrink-0 rounded-full border border-idl-tech-border bg-idl-tech-panel px-4 py-2 text-[13.5px] font-semibold whitespace-nowrap text-idl-graphite-2 transition hover:border-idl-amber"
              >
                {chip.label}
              </Link>
            ) : (
              <span
                key={chip.label}
                className={
                  chip.active
                    ? 'shrink-0 rounded-full bg-idl-ink px-4 py-2 text-[13.5px] font-bold whitespace-nowrap text-white'
                    : 'shrink-0 rounded-full border border-idl-tech-border bg-idl-tech-panel px-4 py-2 text-[13.5px] font-semibold whitespace-nowrap text-idl-graphite-2'
                }
              >
                {chip.label}
              </span>
            ),
          )}
        </div>
      </SectionContainer>
    </section>
  )
}
