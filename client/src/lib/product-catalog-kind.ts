import type { ProductCardDTO, ProductDetailDTO } from '@/types/dto'

export type ProductCatalogKind = 'design' | 'technical'

/** Override temporaneo per prodotti di test senza categoria in catalogo. */
const PRODUCT_CATALOG_KIND_BY_SLUG: Record<string, ProductCatalogKind> = {
  'eclisse-lampada-da-tavolo-artemide-design-vico-magistretti': 'design',
  'lampada-fluorescente-lineare-t5-35w-840-osram-lumilux': 'technical',
}

const CATALOG_KIND_CATEGORY: Record<
  ProductCatalogKind,
  { slug: string; name: string; categorySlug: string }
> = {
  design: {
    slug: 'illuminazione-arredo',
    name: "Illuminazione d'arredo",
    categorySlug: 'illuminazione-arredo',
  },
  technical: {
    slug: 'illuminazione-tecnica',
    name: 'Illuminazione tecnica',
    categorySlug: 'illuminazione-tecnica',
  },
}

const DESIGN_CATEGORY_RE = /arredo|design|decorativ/i
const TECHNICAL_CATEGORY_RE = /tecnica|tecnici|ricambi|lampadine|componenti|driver|alimentator/i

function categoryHaystack(product: ProductDetailDTO): string {
  const parts = [
    product.categorySlug,
    ...(product.categories?.map((c) => `${c.slug} ${c.name}`) ?? []),
  ]
  return parts.filter(Boolean).join(' ').toLowerCase()
}

export function resolveProductCardCatalogKind(product: ProductCardDTO): ProductCatalogKind {
  const slugOverride = PRODUCT_CATALOG_KIND_BY_SLUG[product.slug]
  if (slugOverride) return slugOverride

  const categories = [product.categorySlug].filter(Boolean).join(' ').toLowerCase()
  if (DESIGN_CATEGORY_RE.test(categories)) return 'design'
  if (TECHNICAL_CATEGORY_RE.test(categories)) return 'technical'

  if (product.specTags?.length) return 'technical'

  const text = [product.name, product.shortDescription].filter(Boolean).join(' · ')
  if (/\b(E27|E14|GU10|GU5|R7s|GX53|G9|G4|driver|alimentator|starter|dimmer|T5|T8|G5)\b/i.test(text)) {
    return 'technical'
  }

  return 'design'
}

export function resolveProductCatalogKind(product: ProductDetailDTO): ProductCatalogKind {
  const slugOverride = PRODUCT_CATALOG_KIND_BY_SLUG[product.slug]
  if (slugOverride) return slugOverride

  const categories = categoryHaystack(product)
  if (DESIGN_CATEGORY_RE.test(categories)) return 'design'
  if (TECHNICAL_CATEGORY_RE.test(categories)) return 'technical'

  if (product.brand?.name && !product.specTags?.length) return 'design'
  if (product.specTags?.length) return 'technical'

  const text = [product.name, product.shortDescription].filter(Boolean).join(' · ')
  if (/\b(E27|E14|GU10|GU5|R7s|GX53|G9|G4|driver|alimentator|starter|dimmer|T5|T8|G5)\b/i.test(text)) {
    return 'technical'
  }

  return 'design'
}

/** Applica override slug + categoria fittizia per preview layout (prodotti di test). */
export function applyProductCatalogOverrides(product: ProductDetailDTO): ProductDetailDTO {
  const kindOverride = PRODUCT_CATALOG_KIND_BY_SLUG[product.slug]
  if (!kindOverride) return product

  const category = CATALOG_KIND_CATEGORY[kindOverride]

  return {
    ...product,
    categorySlug: category.categorySlug,
    categories: [{ slug: category.slug, name: category.name }],
    brand:
      product.brand ??
      (kindOverride === 'design' && /artemide/i.test(product.name)
        ? { slug: 'artemide', name: 'Artemide' }
        : kindOverride === 'technical' && /osram/i.test(product.name)
          ? { slug: 'osram', name: 'OSRAM' }
          : null),
  }
}
