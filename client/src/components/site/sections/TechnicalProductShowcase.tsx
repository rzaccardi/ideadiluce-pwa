'use client'

import { Link } from '@/lib/navigation'
import type { ProductCardDTO } from '@/types/dto'
import { formatMoney } from '@/lib/format'
import { formatTechnicalProductRefLine } from '@/lib/technical-product-ref'
import { SectionContainer } from '../primitives'
import { SiteImage } from '../SiteImage'
import { HoverLift, Stagger, StaggerItem } from '@/components/motion'
import { SiteSectionHeader } from './SiteSectionHeader'
import { TechnicalAddToCartButton } from '../category/TechnicalAddToCartButton'
import type { LocalePathFn } from './types'

type Props = {
  products: ReadonlyArray<ProductCardDTO>
  productCount: number
  lp: LocalePathFn
  addToCartLabel?: string
}

function TechnicalShowcaseProductCard({
  product,
  lp,
  addToCartLabel,
}: {
  product: ProductCardDTO
  lp: LocalePathFn
  addToCartLabel: string
}) {
  const refLine = formatTechnicalProductRefLine(product)

  return (
    <HoverLift>
      <div className="rounded-lg border border-idl-tech-border p-4 transition hover:border-idl-muted hover:shadow-md">
        <Link to={lp(`/prodotto/${product.slug}`)} className="block">
          <div className="relative mb-3 aspect-square overflow-hidden bg-idl-tech-panel">
            {product.imageUrl ? (
              <SiteImage src={product.imageUrl} alt="" fill className="object-cover" sizes="25vw" />
            ) : null}
          </div>
          {refLine ? (
            <div className="font-mono text-[10.5px] text-idl-muted">{refLine}</div>
          ) : null}
          <div className="mt-1 line-clamp-2 min-h-[2lh] text-[13.5px] leading-snug font-semibold">{product.name}</div>
        </Link>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-base font-extrabold">{formatMoney(product.priceCents, product.currency)}</span>
          <TechnicalAddToCartButton product={product} label={addToCartLabel} />
        </div>
      </div>
    </HoverLift>
  )
}

export function TechnicalProductGrid({
  products,
  productCount,
  lp,
  addToCartLabel = 'Aggiungi',
}: Props) {
  return (
    <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" stagger={0.07}>
      {products.slice(0, productCount).map((product) => (
        <StaggerItem key={product.slug}>
          <TechnicalShowcaseProductCard product={product} lp={lp} addToCartLabel={addToCartLabel} />
        </StaggerItem>
      ))}
    </Stagger>
  )
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
  addToCartLabel,
}: ShowcaseProps) {
  return (
    <section className="border-t border-idl-tech-border bg-idl-tech-panel">
      <SectionContainer className="py-14">
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
          className="mb-6"
          lp={lp}
        />
        <TechnicalProductGrid
          products={products}
          productCount={productCount}
          lp={lp}
          addToCartLabel={addToCartLabel}
        />
      </SectionContainer>
    </section>
  )
}
