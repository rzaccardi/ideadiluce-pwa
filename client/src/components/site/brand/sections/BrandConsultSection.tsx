import { Link } from '@/lib/navigation'
import { SectionContainer } from '../../primitives'
import { BRAND_CONSULT_CTA } from '@/lib/brand.defaults'
import type { LocalePathFn } from '../../sections/types'

type Props = {
  lp: LocalePathFn
}

export function BrandConsultSection({ lp }: Props) {
  return (
    <section className="border-t border-idl-promo-border bg-idl-promo-bg">
      <SectionContainer className="flex flex-col items-stretch justify-between gap-6 py-8 sm:flex-row sm:items-center sm:gap-10 sm:py-10">
        <div className="max-w-xl">
          <h2 className="text-[20px] font-extrabold tracking-tight text-idl-graphite sm:text-[22px]">
            {BRAND_CONSULT_CTA.title}
          </h2>
          <p className="mt-2 text-[14.5px] leading-relaxed text-idl-promo-text">{BRAND_CONSULT_CTA.description}</p>
        </div>
        <div className="flex w-full shrink-0 flex-col gap-2.5 sm:w-auto sm:flex-row">
          <Link
            to={lp(BRAND_CONSULT_CTA.primaryCta.href)}
            className="rounded-md bg-idl-amber px-5 py-3.5 text-center text-[14.5px] font-bold text-white dark:text-idl-design transition hover:bg-idl-cta-amber-hover sm:whitespace-nowrap"
          >
            {BRAND_CONSULT_CTA.primaryCta.label}
          </Link>
          <Link
            to={lp(BRAND_CONSULT_CTA.secondaryCta.href)}
            className="rounded-md border border-[#e4e4e7] bg-idl-tech-panel px-5 py-3 text-center text-[14.5px] font-bold text-idl-graphite sm:whitespace-nowrap"
          >
            {BRAND_CONSULT_CTA.secondaryCta.label}
          </Link>
        </div>
      </SectionContainer>
    </section>
  )
}
