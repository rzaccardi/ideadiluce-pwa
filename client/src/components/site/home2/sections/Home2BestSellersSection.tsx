'use client'

import type { ProductCardDTO } from '@/types/dto'
import { DesignCatalogProductCard } from '@/components/site/category/DesignCatalogProductGrid'
import { SectionContainer } from '@/components/site/primitives'
import { SiteSectionHeader } from '@/components/site/sections/SiteSectionHeader'
import type { Home2PageContent } from '@/lib/homepage2.defaults'
import type { LocalePathFn } from '@/components/site/sections/types'

type Props = {
  section: Home2PageContent['bestSellers']
  products: ReadonlyArray<ProductCardDTO>
  placeholderHrefs?: Record<string, string>
  lp: LocalePathFn
}

export function Home2BestSellersSection({ section, products, placeholderHrefs = {}, lp }: Props) {
  const items = products.slice(0, 8)

  return (
    <section className="bg-idl-path-design py-12 sm:py-16">
      <SectionContainer>
        <SiteSectionHeader
          eyebrow={section.eyebrow}
          title={section.title}
          subtitle={section.subtitle}
          subtitleClassName="text-idl-ink-muted"
          linkHref={section.linkHref}
          linkLabel={section.linkLabel}
          linkTone="brass"
          titleStyle="serif-lg"
          layout="split"
          lp={lp}
        />
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {items.map((product) => (
            <DesignCatalogProductCard
              key={product.slug}
              product={product}
              to={placeholderHrefs[product.slug] ? lp(placeholderHrefs[product.slug]!) : undefined}
              hidePrice={Boolean(placeholderHrefs[product.slug])}
              lp={lp}
            />
          ))}
        </div>
      </SectionContainer>
    </section>
  )
}
