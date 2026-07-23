'use client'

import { Link } from '@/lib/navigation'
import { ProductSlider } from '@/components/product/ProductSlider'
import { useI18n } from '@/hooks/use-i18n'
import type { MessageKey } from '@/i18n/messages'
import type { LocalePathFn } from '@/components/site/sections/types'
import { SectionContainer } from '@/components/site/primitives'
import { SiteSectionHeader } from '@/components/site/sections/SiteSectionHeader'
import type { HomeProductSliderDTO, HomeProductSliderKey } from '@/types/home-product-sliders'
import { HOME_SLIDER_PRODUCT_COUNT } from '@/lib/home-product-sliders'
import { cn } from '@/utils/cn'

type Props = {
  sliders: ReadonlyArray<HomeProductSliderDTO>
  lp: LocalePathFn
}

type SliderMeta = {
  eyebrowKey: MessageKey
  titleKey: MessageKey
  subtitleKey: MessageKey
  linkKey: MessageKey
  linkHref: string
  eyebrowVariant: 'design' | 'technical' | 'neutral'
  tone: 'design' | 'technical' | 'paper'
}

const SLIDER_META: Record<HomeProductSliderKey, SliderMeta> = {
  'top-design': {
    eyebrowKey: 'home.sliders.top-design.eyebrow',
    titleKey: 'home.sliders.top-design.title',
    subtitleKey: 'home.sliders.top-design.subtitle',
    linkKey: 'home.sliders.top-design.link',
    linkHref: '/negozio?category=arredo',
    eyebrowVariant: 'design',
    tone: 'design',
  },
  'top-technical': {
    eyebrowKey: 'home.sliders.top-technical.eyebrow',
    titleKey: 'home.sliders.top-technical.title',
    subtitleKey: 'home.sliders.top-technical.subtitle',
    linkKey: 'home.sliders.top-technical.link',
    linkHref: '/negozio?category=tecnico',
    eyebrowVariant: 'technical',
    tone: 'technical',
  },
  'in-stock': {
    eyebrowKey: 'home.sliders.in-stock.eyebrow',
    titleKey: 'home.sliders.in-stock.title',
    subtitleKey: 'home.sliders.in-stock.subtitle',
    linkKey: 'home.sliders.in-stock.link',
    linkHref: '/negozio?inStock=1',
    eyebrowVariant: 'neutral',
    tone: 'paper',
  },
  'room-soggiorno': {
    eyebrowKey: 'home.sliders.room-soggiorno.eyebrow',
    titleKey: 'home.sliders.room-soggiorno.title',
    subtitleKey: 'home.sliders.room-soggiorno.subtitle',
    linkKey: 'home.sliders.room-soggiorno.link',
    linkHref: '/ambienti/soggiorno',
    eyebrowVariant: 'design',
    tone: 'paper',
  },
  'room-cucina': {
    eyebrowKey: 'home.sliders.room-cucina.eyebrow',
    titleKey: 'home.sliders.room-cucina.title',
    subtitleKey: 'home.sliders.room-cucina.subtitle',
    linkKey: 'home.sliders.room-cucina.link',
    linkHref: '/ambienti/cucina',
    eyebrowVariant: 'design',
    tone: 'paper',
  },
  'room-bagno': {
    eyebrowKey: 'home.sliders.room-bagno.eyebrow',
    titleKey: 'home.sliders.room-bagno.title',
    subtitleKey: 'home.sliders.room-bagno.subtitle',
    linkKey: 'home.sliders.room-bagno.link',
    linkHref: '/ambienti/bagno',
    eyebrowVariant: 'design',
    tone: 'paper',
  },
}

export function HomeProductSlidersSection({ sliders, lp }: Props) {
  const { t } = useI18n()

  if (sliders.length === 0) return null

  return (
    <>
      {sliders.map((slider) => {
        const meta = SLIDER_META[slider.key]
        const isDesign = meta.tone === 'design'
        const isTechnical = meta.tone === 'technical'

        return (
          <section
            key={slider.key}
            className={cn(
              'overflow-visible',
              isDesign && 'relative bg-idl-design text-idl-design-fg',
              isTechnical && 'border-t border-idl-border bg-white',
              meta.tone === 'paper' && 'border-t border-idl-border bg-idl-cream/40',
            )}
          >
            {isDesign ? (
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute top-10 -left-16 size-[420px] rounded-full bg-[radial-gradient(circle,rgba(120, 120, 125,0.16)_0%,transparent_70%)]" />
              </div>
            ) : null}
            <SectionContainer className={cn('relative z-[2] pt-12 pb-6 sm:pt-14', isTechnical && 'pt-12')}>
              <SiteSectionHeader
                eyebrow={t(meta.eyebrowKey)}
                eyebrowVariant={meta.eyebrowVariant}
                title={t(meta.titleKey)}
                subtitle={t(meta.subtitleKey)}
                subtitleClassName={isDesign ? 'text-idl-design-subtle' : undefined}
                linkHref={meta.linkHref}
                linkLabel={t(meta.linkKey)}
                linkTone={isDesign ? 'glow' : isTechnical ? 'amber' : 'brass'}
                titleStyle={isDesign ? 'serif-lg' : 'sans-lg'}
                layout="split"
                lp={lp}
              />
            </SectionContainer>
            <div className={cn('relative z-[2] pb-12 sm:pb-14', isTechnical && 'pb-12')}>
              <ProductSlider
                products={slider.products.slice(0, HOME_SLIDER_PRODUCT_COUNT)}
                variant="fullBleed"
                loop
                cardKind={isTechnical ? 'technical' : isDesign ? 'design' : 'auto'}
                lp={lp}
              />
            </div>
            <SectionContainer className="relative z-[2] pb-5 sm:hidden">
              <Link
                to={lp(meta.linkHref)}
                className={cn(
                  'text-sm font-bold',
                  isDesign ? 'text-idl-glow' : isTechnical ? 'text-idl-amber' : 'text-idl-brass',
                )}
              >
                {t(meta.linkKey)} →
              </Link>
            </SectionContainer>
          </section>
        )
      })}
    </>
  )
}
