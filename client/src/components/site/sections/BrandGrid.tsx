import { Link } from '@/lib/navigation'
import { Stagger, StaggerItem } from '@/components/motion'
import { brandHref, brandSlugFromDisplayName } from '@/lib/brand.defaults'
import type { LocalePathFn } from './types'

export type BrandGridItem =
  | string
  | { name: string; href?: string; meta?: string }
  | { title: string; href?: string; meta?: string }

type Props = {
  items: ReadonlyArray<BrandGridItem>
  lp: LocalePathFn
  variant?: 'home' | 'editorial'
  stagger?: number
}

function resolveBrandHref(name: string, href: string | undefined, lp: LocalePathFn): string {
  if (href) return lp(href)
  const slug = brandSlugFromDisplayName(name)
  if (slug) return lp(brandHref(slug))
  return lp(`/negozio?q=${encodeURIComponent(name)}`)
}

function resolveBrand(item: BrandGridItem, lp: LocalePathFn) {
  if (typeof item === 'string') {
    return {
      name: item,
      href: resolveBrandHref(item, undefined, lp),
      meta: undefined,
    }
  }
  const name = 'name' in item ? item.name : item.title
  return {
    name,
    href: resolveBrandHref(name, item.href, lp),
    meta: item.meta,
  }
}

export function BrandGrid({ items, lp, variant = 'home', stagger = 0.04 }: Props) {
  const gridClass =
    variant === 'home'
      ? 'grid grid-cols-2 overflow-hidden rounded-[10px] border border-idl-tech-border sm:grid-cols-3 lg:grid-cols-6'
      : 'grid grid-cols-2 overflow-hidden rounded-[10px] border border-idl-tech-border sm:grid-cols-3 lg:grid-cols-4'

  return (
    <Stagger className={gridClass} stagger={stagger}>
      {items.map((brand) => {
        const { name, href, meta } = resolveBrand(brand, lp)
        return (
          <StaggerItem key={name}>
            <Link
              to={href}
              className={
                variant === 'home'
                  ? 'block border-b border-r border-idl-tech-border px-3 py-6 text-center text-sm font-bold tracking-widest text-idl-graphite-2 uppercase transition hover:bg-idl-tech-panel hover:text-idl-brass'
                  : 'flex min-h-[88px] flex-col items-center justify-center border-b border-r border-idl-tech-border px-3 py-5 text-center transition hover:bg-idl-tech-panel hover:text-idl-brass'
              }
            >
              <span className="text-sm font-bold tracking-widest text-idl-graphite-2 uppercase">{name}</span>
              {meta ? <span className="mt-1 text-[11px] text-idl-muted">{meta}</span> : null}
            </Link>
          </StaggerItem>
        )
      })}
    </Stagger>
  )
}
