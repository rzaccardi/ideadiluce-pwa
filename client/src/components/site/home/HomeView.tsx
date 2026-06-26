'use client'

import { Reveal } from '@/components/motion'
import type { HomePageContent } from '@/types/site-content'
import type { ProductCardDTO } from '@/types/dto'
import { useLocalePath } from '@/hooks/use-locale-path'
import {
  CatalogSearchBridge,
  DesignProductShowcase,
  NewsletterSection,
  TechnicalProductShowcase,
} from '../sections'
import {
  HomeB2bSection,
  HomeBrandsSection,
  HomeGuidesSection,
  HomeHeroSection,
  HomePathsSection,
  HomeRoomsSection,
  HomeSocketsSection,
} from './sections'

type Props = {
  content: Readonly<HomePageContent>
  designProducts: ProductCardDTO[]
  technicalProducts: ProductCardDTO[]
}

export function HomeView({ content, designProducts, technicalProducts }: Props) {
  const lp = useLocalePath()

  return (
    <div className="bg-white">
      <Reveal immediate>
        <HomeHeroSection design={content.hero.design} technical={content.hero.technical} lp={lp} />
      </Reveal>

      <Reveal>
        <CatalogSearchBridge
          title={content.search.title}
          subtitle={content.search.subtitle}
          placeholder={content.search.placeholder}
          ctaLabel={content.search.ctaLabel}
          hints={content.search.hints}
          lp={lp}
        />
      </Reveal>

      <Reveal>
        <HomeSocketsSection section={content.sockets} lp={lp} />
      </Reveal>
      <Reveal>
        <HomePathsSection section={content.paths} lp={lp} />
      </Reveal>
      <Reveal>
        <HomeRoomsSection section={content.rooms} lp={lp} />
      </Reveal>

      <Reveal>
        <DesignProductShowcase
          eyebrow={content.designShowcase.eyebrow}
          title={content.designShowcase.title}
          subtitle={content.designShowcase.subtitle}
          linkLabel={content.designShowcase.linkLabel}
          linkHref={content.designShowcase.linkHref}
          products={designProducts}
          productCount={content.designShowcase.productCount}
          lp={lp}
        />
      </Reveal>

      <Reveal>
        <TechnicalProductShowcase
          eyebrow={content.technicalShowcase.eyebrow}
          title={content.technicalShowcase.title}
          subtitle={content.technicalShowcase.subtitle}
          linkLabel={content.technicalShowcase.linkLabel}
          linkHref={content.technicalShowcase.linkHref}
          products={technicalProducts}
          productCount={content.technicalShowcase.productCount}
          lp={lp}
        />
      </Reveal>

      <Reveal>
        <HomeBrandsSection section={content.brands} lp={lp} />
      </Reveal>
      <Reveal>
        <HomeGuidesSection section={content.guides} lp={lp} />
      </Reveal>
      <Reveal>
        <HomeB2bSection b2b={content.b2b} leadGen={content.leadGen} lp={lp} />
      </Reveal>

      <Reveal>
        <NewsletterSection
          title={content.newsletter.title}
          description={content.newsletter.description}
          placeholder={content.newsletter.placeholder}
          ctaLabel={content.newsletter.ctaLabel}
          privacyNote={content.newsletter.privacyNote}
        />
      </Reveal>
    </div>
  )
}
