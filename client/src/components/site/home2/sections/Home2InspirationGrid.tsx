'use client'

import { Link } from '@/lib/navigation'
import { SiteImage } from '@/components/site/SiteImage'
import { SectionContainer } from '@/components/site/primitives'
import { SiteSectionHeader } from '@/components/site/sections/SiteSectionHeader'
import type { ProductCardDTO } from '@/types/dto'
import type { Home2PageContent } from '@/lib/homepage2.defaults'
import type { LocalePathFn } from '@/components/site/sections/types'
import { formatMoney } from '@/lib/format'

type Props = {
  section: Home2PageContent['inspiration']
  products: ReadonlyArray<ProductCardDTO>
  lp: LocalePathFn
}

export function Home2InspirationGrid({ section, products, lp }: Props) {
  const items = products.filter((p) => p.imageUrl).slice(0, 8)

  return (
    <section className="border-t border-idl-border bg-white py-12 sm:py-16 dark:bg-idl-tech-panel">
      <SectionContainer>
        <SiteSectionHeader
          eyebrow={section.eyebrow}
          title={section.title}
          subtitle={section.subtitle}
          linkHref={section.linkHref}
          linkLabel={section.linkLabel}
          linkTone="brass"
          titleStyle="serif-md"
          layout="split"
          lp={lp}
        />
        <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {items.map((product) => (
            <Link
              key={product.slug}
              to={lp(`/prodotto/${product.slug}`)}
              className="group relative aspect-[4/5] overflow-hidden rounded-md bg-idl-cream"
            >
                {product.imageUrl ? (
                  <SiteImage
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    sizes="(max-width:640px) 50vw, 25vw"
                    className="object-cover transition duration-700 group-hover:scale-[1.03]"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                <div className="absolute inset-x-0 bottom-0 translate-y-2 p-3 opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
                  <p className="line-clamp-2 font-serif text-[13px] leading-snug text-white">{product.name}</p>
                  <p className="mt-1 text-[12px] font-bold text-idl-glow">
                    {formatMoney(product.priceCents, product.currency)}
                  </p>
                </div>
              </Link>
          ))}
        </div>
      </SectionContainer>
    </section>
  )
}
