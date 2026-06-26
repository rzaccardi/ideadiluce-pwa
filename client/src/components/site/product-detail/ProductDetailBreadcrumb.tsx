'use client'

import { Link } from '@/lib/navigation'
import type { CategoryBreadcrumbItem } from '@/types/category-landing'
import { CategoryBreadcrumb } from '@/components/site/category/CategoryBreadcrumb'
import { SectionContainer } from '@/components/site/primitives'
import type { LocalePathFn } from '@/components/site/sections/types'

type Props = {
  items: ReadonlyArray<CategoryBreadcrumbItem>
  lp: LocalePathFn
  variant?: 'design' | 'technical'
  inHero?: boolean
}

export function ProductDetailBreadcrumb({ items, lp, variant = 'design', inHero }: Props) {
  if (inHero && variant === 'design') {
    return (
      <SectionContainer className="relative z-[2] pt-4 pb-0 sm:pt-5">
        <CategoryBreadcrumb items={items} lp={lp} variant="design" />
      </SectionContainer>
    )
  }

  if (variant === 'technical') {
    return (
      <SectionContainer className="pt-4 sm:pt-5">
        <CategoryBreadcrumb items={items} lp={lp} variant="technical" />
      </SectionContainer>
    )
  }

  return (
    <SectionContainer className="pt-4 sm:pt-5">
      <CategoryBreadcrumb items={items} lp={lp} variant="design" />
    </SectionContainer>
  )
}

export function buildProductBreadcrumbItems(input: {
  productName: string
  category?: { slug: string; name: string } | null
  lp: LocalePathFn
  catalogKind: 'design' | 'technical'
}): CategoryBreadcrumbItem[] {
  const catalogHref =
    input.catalogKind === 'design'
      ? '/categoria-prodotto/illuminazione-arredo'
      : '/categoria-prodotto/illuminazione-tecnica'
  const catalogLabel =
    input.catalogKind === 'design' ? "Illuminazione d'arredo" : 'Illuminazione tecnica'

  return [
    { label: 'Home', href: '/' },
    { label: catalogLabel, href: catalogHref },
    ...(input.category ? [{ label: input.category.name, href: `/categoria/${input.category.slug}` }] : []),
    { label: input.productName },
  ]
}

export function ProductDetailContactLink({
  href,
  children,
  className,
}: {
  href: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Link to={href} className={className}>
      {children}
    </Link>
  )
}
