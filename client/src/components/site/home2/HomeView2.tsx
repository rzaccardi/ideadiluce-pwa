'use client'

import { useMemo } from 'react'
import { Reveal } from '@/components/motion'
import { useLocalePath } from '@/hooks/use-locale-path'
import type { HomePageContent } from '@/types/site-content'
import type { ProductCardDTO } from '@/types/dto'
import type { BrandCard } from '@/lib/brand.defaults'
import { mergeHome2Content, pickCatalogImages } from '@/lib/homepage2.defaults'
import {
  Home2BestSellersSection,
  Home2CategorySplit,
  Home2HeroSection,
  Home2InspirationGrid,
  Home2PromoStrip,
  Home2VisualCategories,
} from './sections'
import { HomeBrandsSection, HomeGuidesSection } from '../home/sections'
import { NewsletterSection } from '../sections'

type Props = {
  cmsContent: HomePageContent
  designProducts: ProductCardDTO[]
  homeBrands: BrandCard[]
  featuredGuides: HomePageContent['guides']
}

export function HomeView2({ cmsContent, designProducts, homeBrands, featuredGuides }: Props) {
  const lp = useLocalePath()
  const content = useMemo(() => mergeHome2Content(cmsContent), [cmsContent])

  const heroImage = designProducts[0]?.imageUrl ?? null
  const splitImages = pickCatalogImages(designProducts.slice(1), 2) as [string | undefined, string | undefined]
  const categoryImages = pickCatalogImages(designProducts.slice(3), content.categoryTiles.length)
  const gridProducts = designProducts.length ? designProducts : []

  const cmsWithGuides = useMemo(
    () => ({
      ...cmsContent,
      guides: featuredGuides,
    }),
    [cmsContent, featuredGuides],
  )

  return (
    <main className="bg-white dark:bg-idl-tech-panel">
      <Reveal immediate>
        <Home2HeroSection content={content.hero} heroImageUrl={heroImage} lp={lp} />
      </Reveal>

      <Reveal>
        <Home2PromoStrip items={content.promos} />
      </Reveal>

      <Reveal>
        <Home2CategorySplit blocks={content.splitBlocks} imageUrls={splitImages} lp={lp} />
      </Reveal>

      <Reveal>
        <Home2VisualCategories tiles={content.categoryTiles} imageUrls={categoryImages} lp={lp} />
      </Reveal>

      <Reveal>
        <Home2BestSellersSection section={content.bestSellers} products={gridProducts} lp={lp} />
      </Reveal>

      <Reveal>
        <Home2InspirationGrid section={content.inspiration} products={gridProducts} lp={lp} />
      </Reveal>

      <Reveal>
        <HomeBrandsSection
          section={{
            ...cmsContent.brands,
            title: content.brandsEyebrow,
          }}
          brands={homeBrands}
          lp={lp}
        />
      </Reveal>

      <Reveal>
        <HomeGuidesSection section={cmsWithGuides.guides} lp={lp} />
      </Reveal>

      <Reveal>
        <NewsletterSection
          title={cmsContent.newsletter.title}
          description={cmsContent.newsletter.description}
          placeholder={cmsContent.newsletter.placeholder}
          ctaLabel={cmsContent.newsletter.ctaLabel}
          privacyNote={cmsContent.newsletter.privacyNote}
        />
      </Reveal>
    </main>
  )
}
