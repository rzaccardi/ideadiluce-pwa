import type { HomeHeroHalf } from '@/types/site-content'
import { Link } from '@/lib/navigation'
import { Eyebrow } from '../../primitives'
import { FadeIn } from '@/components/motion'
import { attaccoHrefForCode } from '@/lib/attacco.defaults'
import type { LocalePathFn } from '../../sections/types'

type Props = {
  design: HomeHeroHalf
  technical: HomeHeroHalf
  lp: LocalePathFn
}

export function HomeHeroSection({ design, technical, lp }: Props) {
  return (
    <div className="grid border-b border-idl-border lg:grid-cols-2">
      <FadeIn className="relative overflow-hidden bg-idl-design px-6 py-10 text-idl-design-fg sm:px-12 sm:py-16 lg:px-16 lg:py-[74px]">
        <div className="pointer-events-none absolute -top-20 -right-10 size-[460px] rounded-full bg-[radial-gradient(circle,rgba(240,173,87,0.26)_0%,rgba(240,173,87,0)_70%)]" />
        <div className="relative z-[2] max-w-lg lg:ml-auto">
          <Eyebrow>{design.eyebrow}</Eyebrow>
          <h1 className="mt-5 font-serif text-[31px] leading-[1.07] font-medium tracking-tight sm:text-[44px]">
            {design.title}
          </h1>
          <p className="mt-4 text-[16.5px] leading-relaxed text-idl-design-muted">{design.description}</p>
          <Link
            to={lp(design.ctaHref)}
            className="mt-7 inline-flex items-center gap-2 rounded-[3px] bg-idl-glow px-6 py-3.5 text-[15px] font-bold text-idl-design"
          >
            {design.ctaLabel}
          </Link>
          {design.footerLine ? (
            <p className="mt-8 font-mono text-[11px] tracking-wide text-idl-design-dim">{design.footerLine}</p>
          ) : null}
        </div>
      </FadeIn>
      <FadeIn
        delay={0.1}
        className="border-idl-border bg-white px-6 py-10 sm:px-12 sm:py-16 lg:border-l lg:px-16 lg:py-[74px]"
      >
        <Eyebrow variant="technical">{technical.eyebrow}</Eyebrow>
        <h2 className="mt-5 text-[28px] leading-[1.05] font-extrabold tracking-tight sm:text-[43px]">
          {technical.title}
        </h2>
        <p className="mt-4 text-[16.5px] leading-relaxed text-idl-muted">{technical.description}</p>
        <Link
          to={lp(technical.ctaHref)}
          className="mt-7 inline-flex items-center gap-2 rounded-md bg-idl-amber px-6 py-3.5 text-[15px] font-bold text-white"
        >
          {technical.ctaLabel}
        </Link>
        {technical.chips?.length ? (
          <div className="mt-8 flex flex-wrap gap-2">
            {technical.chips.map((chip) => (
              <Link
                key={chip}
                to={lp(attaccoHrefForCode(chip))}
                className="rounded-md border border-idl-tech-chip-border bg-idl-tech-chip px-3 py-1.5 font-mono text-[11.5px] text-idl-graphite-2 transition hover:border-idl-amber hover:text-idl-amber"
              >
                {chip}
              </Link>
            ))}
          </div>
        ) : null}
      </FadeIn>
    </div>
  )
}
