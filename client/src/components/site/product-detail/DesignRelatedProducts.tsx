import { Link } from '@/lib/navigation'
import type { ProductCardDTO } from '@/types/dto'
import { formatMoney } from '@/lib/format'
import { SiteImage } from '@/components/site/SiteImage'
import type { LocalePathFn } from '@/components/site/sections/types'

type Props = {
  products: ReadonlyArray<ProductCardDTO>
  lp: LocalePathFn
  brandName?: string | null
}

export function DesignRelatedProducts({ products, lp, brandName }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
      {products.map((product) => (
        <Link key={product.slug} to={lp(`/prodotto/${product.slug}`)} className="group block">
          <div className="relative mb-3.5 aspect-[4/5] overflow-hidden rounded-[3px] shadow-[0_0_60px_rgba(240,173,87,0.07)]">
            {product.imageUrl ? (
              <SiteImage
                src={product.imageUrl}
                alt=""
                fill
                className="object-cover transition duration-500 group-hover:scale-[1.02]"
                sizes="25vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-idl-design-elevated text-xs text-idl-design-dim">
                —
              </div>
            )}
          </div>
          <div className="mb-1 font-mono text-[11px] tracking-[0.08em] text-idl-glow uppercase">
            {brandName ?? product.categorySlug ?? 'IDEADILUCE'}
          </div>
          <div className="line-clamp-2 min-h-[2lh] font-serif text-[17px] leading-snug font-medium text-idl-design-fg sm:text-[19px]">
            {product.name.split(/\s*[—–-]\s+/)[0]}
          </div>
          <div className="mt-1 line-clamp-2 min-h-[2lh] text-[12.5px] leading-normal text-idl-design-dim">
            {product.shortDescription ?? '\u00A0'}
          </div>
          <div className="mt-2 text-[15px] font-bold text-idl-design-fg">
            {formatMoney(product.priceCents, product.currency)}
          </div>
        </Link>
      ))}
    </div>
  )
}
