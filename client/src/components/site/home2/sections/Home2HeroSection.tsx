'use client'

import { Link } from '@/lib/navigation'
import { SiteImage } from '@/components/site/SiteImage'
import { Eyebrow } from '@/components/site/primitives'
import { FadeIn } from '@/components/motion'
import type { Home2PageContent } from '@/lib/homepage2.defaults'
import type { LocalePathFn } from '@/components/site/sections/types'

type Props = {
  content: Home2PageContent['hero']
  heroImageUrl: string
  lp: LocalePathFn
}

export function Home2HeroSection({ content, heroImageUrl, lp }: Props) {
  return (
    <section className="relative min-h-[min(88vh,720px)] overflow-hidden bg-idl-design text-idl-design-fg">
      <div className="absolute inset-0">
        <SiteImage
          src={heroImageUrl}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-idl-design/95 via-idl-design/72 to-idl-design/20" />
      </div>

      <div className="relative z-[2] mx-auto flex min-h-[min(88vh,720px)] max-w-[1440px] items-end px-5 pb-14 pt-28 sm:px-10 sm:pb-20 lg:px-14">
        <FadeIn className="max-w-xl lg:max-w-2xl">
          <Eyebrow>{content.eyebrow}</Eyebrow>
          <h1 className="mt-4 font-serif text-[clamp(2rem,5vw,3.75rem)] leading-[1.05] font-medium tracking-tight">
            {content.title}
          </h1>
          <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-idl-design-muted sm:text-[17px]">
            {content.description}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to={lp(content.ctaHref)}
              className="inline-flex items-center rounded-[3px] bg-idl-glow px-7 py-3.5 text-[15px] font-bold text-idl-design"
            >
              {content.ctaLabel}
            </Link>
            <Link
              to={lp(content.secondaryCtaHref)}
              className="inline-flex items-center rounded-[3px] border border-idl-design-fg/25 px-7 py-3.5 text-[15px] font-bold text-idl-design-fg backdrop-blur-sm transition hover:bg-idl-design-fg/10"
            >
              {content.secondaryCtaLabel}
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
