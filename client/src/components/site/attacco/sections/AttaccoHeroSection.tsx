import { CategoryBreadcrumb } from '../../category/CategoryBreadcrumb'
import { Eyebrow, SectionContainer } from '../../primitives'
import { ATTACCO_HERO } from '@/lib/attacco.defaults'
import type { LocalePathFn } from '../../sections/types'

type Props = {
  lp: LocalePathFn
  onOpenWizard: () => void
}

export function AttaccoHeroSection({ lp, onOpenWizard }: Props) {
  return (
    <section className="border-b border-idl-tech-border bg-idl-tech-panel">
      <SectionContainer className="pb-8 pt-5 sm:pb-9 sm:pt-5">
        <CategoryBreadcrumb
          items={[{ label: 'Home', href: '/' }, { label: 'Scegli per attacco' }]}
          lp={lp}
          variant="technical"
        />
        <div className="flex flex-col items-stretch justify-between gap-6 lg:flex-row lg:items-end lg:gap-8">
          <div className="max-w-2xl">
            <Eyebrow variant="technical" className="mb-3.5">
              {ATTACCO_HERO.eyebrow}
            </Eyebrow>
            <h1 className="text-[30px] leading-[1.06] font-extrabold tracking-tight text-idl-graphite sm:text-[38px]">
              Trova la lampadina giusta
              <br />
              per il tuo attacco
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-idl-graphite-2 sm:text-base">{ATTACCO_HERO.subtitle}</p>
          </div>
          <div
            id="wizard"
            className="w-full shrink-0 rounded-xl border border-idl-promo-border bg-idl-promo-bg p-5 sm:max-w-[360px] sm:p-6"
          >
            <div className="text-[18px] font-extrabold tracking-tight text-idl-graphite sm:text-[19px]">
              {ATTACCO_HERO.wizardTitle}
            </div>
            <p className="mt-1.5 text-[13.5px] leading-snug text-idl-promo-text">{ATTACCO_HERO.wizardDescription}</p>
            <button
              type="button"
              onClick={onOpenWizard}
              className="mt-4 w-full rounded-[7px] bg-idl-amber px-5 py-3.5 text-[14.5px] font-bold text-white dark:text-idl-design transition hover:bg-idl-cta-amber-hover sm:w-auto"
            >
              {ATTACCO_HERO.wizardCta}
            </button>
          </div>
        </div>
      </SectionContainer>
    </section>
  )
}
