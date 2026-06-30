'use client'

import type { ProductCardDTO } from '@/types/dto'
import { ProductSlider } from '@/components/product/ProductSlider'
import { SectionContainer } from '../primitives'
import { SiteSectionHeader } from './SiteSectionHeader'
import { HOME_SLIDER_PRODUCT_COUNT } from '@/lib/home-product-sliders'
import type { LocalePathFn } from './types'

type Props = {
  products: ReadonlyArray<ProductCardDTO>
  productCount: number
  lp: LocalePathFn
}

type ShowcaseProps = Props & {
  eyebrow: string
  title: string
  subtitle: string
  linkLabel: string
  linkHref: string
}

export function TechnicalProductShowcase({
  eyebrow,
  title,
  subtitle,
  linkLabel,
  linkHref,
  products,
  productCount,
  lp,
}: ShowcaseProps) {
  const items = products.slice(0, Math.max(productCount, HOME_SLIDER_PRODUCT_COUNT))

  return (
    <section className="overflow-visible border-t border-idl-tech-border bg-idl-tech-panel">
      <SectionContainer className="pt-14 pb-6">
        <SiteSectionHeader
          eyebrow={eyebrow}
          eyebrowVariant="technical"
          title={title}
          subtitle={subtitle}
          linkHref={linkHref}
          linkLabel={linkLabel}
          linkTone="amber"
          titleStyle="sans-lg"
          layout="split"
          lp={lp}
        />
      </SectionContainer>
      <div className="pb-14">
        <ProductSlider products={items} variant="fullBleed" loop cardKind="technical" lp={lp} />
      </div>
    </section>
  )
}
