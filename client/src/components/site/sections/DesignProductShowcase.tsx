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

export function DesignProductShowcase({
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
    <section className="relative overflow-hidden bg-idl-design text-idl-design-fg">
      <div className="pointer-events-none absolute top-10 -left-16 size-[420px] rounded-full bg-[radial-gradient(circle,rgba(201, 162, 75,0.16)_0%,transparent_70%)]" />
      <SectionContainer className="relative z-[2] py-14">
        <SiteSectionHeader
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
          subtitleClassName="text-idl-design-subtle"
          linkHref={linkHref}
          linkLabel={linkLabel}
          linkTone="glow"
          titleStyle="serif-lg"
          layout="split"
          className="mb-6"
          lp={lp}
        />
        <ProductSlider products={items} variant="contained" />
      </SectionContainer>
    </section>
  )
}
