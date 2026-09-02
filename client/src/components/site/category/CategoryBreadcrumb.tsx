import { Link } from '@/lib/navigation'
import type { CategoryBreadcrumbItem } from '@/types/category-landing'
import type { LocalePathFn } from '../sections/types'

type Props = {
  items: ReadonlyArray<CategoryBreadcrumbItem>
  lp: LocalePathFn
  variant?: 'design' | 'technical'
  /** Superficie scura (hero catalogo). Default: true solo per `design`. */
  onDark?: boolean
}

export function CategoryBreadcrumb({ items, lp, variant = 'design', onDark }: Props) {
  const dark = onDark ?? variant === 'design'
  return (
    <nav
      className={
        dark
          ? 'mb-5 overflow-x-auto font-mono text-[11px] text-idl-design-dim [-ms-overflow-style:none] [scrollbar-width:none] sm:mb-8 sm:text-[11.5px] [&::-webkit-scrollbar]:hidden'
          : variant === 'design'
            ? 'mb-5 overflow-x-auto font-mono text-[11px] text-idl-ink-muted [-ms-overflow-style:none] [scrollbar-width:none] sm:mb-8 sm:text-[11.5px] [&::-webkit-scrollbar]:hidden'
            : 'mb-3 overflow-x-auto font-mono text-[11px] text-idl-muted [-ms-overflow-style:none] [scrollbar-width:none] sm:mb-4 sm:text-[11.5px] [&::-webkit-scrollbar]:hidden'
      }
      aria-label="Breadcrumb"
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        const tone = dark
          ? isLast
            ? 'text-idl-design-muted'
            : 'text-idl-design-dim'
          : variant === 'design'
            ? isLast
              ? 'text-idl-ink-soft'
              : 'text-idl-ink-muted'
            : isLast
              ? 'text-idl-graphite-2'
              : 'text-idl-muted'

        return (
          <span key={`${item.label}-${index}`}>
            {index > 0 ? <span className="mx-1.5">·</span> : null}
            {item.href && !isLast ? (
              <Link to={lp(item.href)} className="transition hover:text-idl-brass">
                {item.label}
              </Link>
            ) : (
              <span className={tone}>{item.label}</span>
            )}
          </span>
        )
      })}
    </nav>
  )
}
