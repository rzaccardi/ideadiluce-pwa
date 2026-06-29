import { Link } from '@/lib/navigation'
import type { ProductCardDTO } from '@/types/dto'
import { formatMoney } from '@/lib/format'
import { SectionContainer } from '../primitives'
import { SiteImage } from '../SiteImage'
import { HoverLift, Stagger, StaggerItem } from '@/components/motion'
import { SiteSectionHeader } from './SiteSectionHeader'
import type { LocalePathFn } from './types'

type Props = {
  products: ReadonlyArray<ProductCardDTO>
  productCount: number
  lp: LocalePathFn
}

export function DesignProductGrid({ products, productCount, lp }: Props) {
  return (
    <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4" stagger={0.08}>
      {products.slice(0, productCount).map((product) => (
        <StaggerItem key={product.slug}>
          <HoverLift>
            <Link to={lp(`/prodotto/${product.slug}`)} className="group block">
              <div className="relative aspect-[4/5] overflow-hidden bg-idl-design-elevated">
                {product.imageUrl ? (
                  <SiteImage
                    src={product.imageUrl}
                    alt=""
                    fill
                    className="object-cover transition duration-500 group-hover:scale-[1.03]"
                    sizes="(max-width:768px) 50vw, 25vw"
                  />
                ) : null}
              </div>
              <div className="mt-3 font-mono text-[11px] tracking-wide text-idl-glow uppercase">
                {product.categorySlug ?? '—'}
              </div>
              <div className="mt-1 line-clamp-2 min-h-[2lh] font-serif text-[19px] leading-snug font-medium">
                {product.name}
              </div>
              <div className="mt-2 text-[15px] font-bold">{formatMoney(product.priceCents, product.currency)}</div>
            </Link>
          </HoverLift>
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
          className="mb-8"
          lp={lp}
        />
        <DesignProductGrid products={products} productCount={productCount} lp={lp} />
      </SectionContainer>
    </section>
  )
}
