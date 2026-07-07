import { ExternalLink } from '@/lib/link-title'
import { CategoryBreadcrumb } from '../../category/CategoryBreadcrumb'
import { Eyebrow, SectionContainer } from '../../primitives'
import { AMBIENTI_HERO } from '@/lib/ambienti.defaults'
import type { LocalePathFn } from '../../sections/types'

type Props = {
  lp: LocalePathFn
}

export function AmbientiHeroSection({ lp }: Props) {
  return (
    <section className="relative overflow-hidden bg-idl-design text-idl-design-fg">
      <div className="pointer-events-none absolute -top-16 right-[10%] size-[320px] rounded-full bg-[radial-gradient(circle,rgba(201, 162, 75,0.20)_0%,rgba(201, 162, 75,0)_68%)] sm:size-[420px] lg:-top-[60px] lg:size-[520px]" />
      <SectionContainer className="relative z-[2] pt-4 pb-10 sm:pb-14 sm:pt-5">
        <CategoryBreadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Acquista per ambiente' },
          ]}
          lp={lp}
          variant="design"
        />
        <div className="mx-auto max-w-[900px] pt-6 text-center sm:pt-10">
          <Eyebrow className="mb-4 sm:mb-5">{AMBIENTI_HERO.eyebrow}</Eyebrow>
          <h1 className="font-serif text-[34px] leading-[1.05] font-medium tracking-tight sm:text-[44px] lg:text-[52px]">
            {AMBIENTI_HERO.h1}
          </h1>
          <p className="mx-auto mt-4 max-w-[640px] text-[15px] leading-relaxed text-idl-design-muted sm:mt-5 sm:text-[17px]">
            {AMBIENTI_HERO.subtitle}
          </p>
          <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:mt-8 sm:flex-row sm:items-center">
            <ExternalLink
              href={AMBIENTI_HERO.primaryCta.href}
              className="rounded-[7px] bg-idl-glow px-6 py-3.5 text-center text-[15px] font-bold text-idl-design transition hover:bg-[#f7bd6f]"
            >
              {AMBIENTI_HERO.primaryCta.label}
            </ExternalLink>
            <ExternalLink
              href={AMBIENTI_HERO.secondaryCta.href}
              className="rounded-[7px] border border-white/20 px-6 py-3 text-center text-[15px] font-semibold text-idl-design-fg transition hover:border-idl-glow hover:text-idl-glow"
            >
              {AMBIENTI_HERO.secondaryCta.label}
            </ExternalLink>
          </div>
        </div>
      </SectionContainer>
    </section>
  )
}
