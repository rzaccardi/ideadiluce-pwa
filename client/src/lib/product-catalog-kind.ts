import { stripLocalePrefix } from '@/lib/locale'
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
    slug: 'arredo',
    name: "Illuminazione d'arredo",
    categorySlug: 'arredo',
  },
  technical: {
    slug: 'illuminazione-tecnica',
    name: 'Illuminazione tecnica',
    categorySlug: 'illuminazione-tecnica',
  },
}

/** Allineato a `catalogWorldOfCategorySlug` — senza import circolare da catalog-filters. */
const DESIGN_CATEGORY_RE = /arredo|design|decorativ/i
const TECHNICAL_CATEGORY_RE =
  /tecnica|tecnici|tecnico|ricambi|lampadine|componenti|driver|alimentator/i

/**
 * Segnali forti di prodotto tecnico/ricambio.
 * NON usare attacchi (E27/GU10) o specTags da soli: le lampade d'arredo li hanno spesso
 * e finirebbero con la card tecnica + tasto Aggiungi.
 */
const TECHNICAL_PRODUCT_NAME_RE =
  /\b(lampadin[ae]|driver|alimentator[ei]?|starter|ricambi?|fluorescent[ei]|neon|ballast|trasformatore|led[\s-]?strip|nastro[\s-]?led|tubo[\s-]?led)\b/i

function categoryHaystack(product: ProductDetailDTO): string {
  const parts = [
    product.categorySlug,
    ...(product.categories?.map((c) => `${c.slug} ${c.name}`) ?? []),
  ]
  return parts.filter(Boolean).join(' ').toLowerCase()
}

function worldFromCategoryText(text: string | null | undefined): ProductCatalogKind | null {
  if (!text?.trim()) return null
  // Preferisci design se presente (prodotto in entrambi i mondi → card arredo senza Add).
  if (DESIGN_CATEGORY_RE.test(text)) return 'design'
  if (TECHNICAL_CATEGORY_RE.test(text)) return 'technical'
  return null
}

function kindFromTechnicalNameSignal(text: string): ProductCatalogKind | null {
  if (TECHNICAL_PRODUCT_NAME_RE.test(text)) return 'technical'
  return null
}

/**
 * Sceglie il layout card (arredo senza Aggiungi vs tecnica con Aggiungi).
 * Default: design — meglio omettere Aggiungi su un dubbio arredo che mostrarlo per errore.
 */
export function resolveProductCardCatalogKind(product: ProductCardDTO): ProductCatalogKind {
  const slugOverride = PRODUCT_CATALOG_KIND_BY_SLUG[product.slug]
  if (slugOverride) return slugOverride

  const fromCategory = worldFromCategoryText(product.categorySlug)
  if (fromCategory) return fromCategory

  const text = [product.name, product.shortDescription].filter(Boolean).join(' · ')
  const fromName = kindFromTechnicalNameSignal(text)
  if (fromName) return fromName

  return 'design'
}

export function extractProductSlugFromPath(pathname: string): string | null {
  const path = stripLocalePrefix(pathname)
  const normalized = path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path
  const match = normalized.match(/^\/(?:product|prodotto)\/([^/]+)/)
  return match?.[1] ?? null
}

/** Stima design vs technical quando il prodotto non è ancora caricato (slug / override). */
export function resolveProductCatalogKindFromSlug(slug: string): ProductCatalogKind {
  const slugOverride = PRODUCT_CATALOG_KIND_BY_SLUG[slug]
  if (slugOverride) return slugOverride

  const normalized = slug.toLowerCase()
  const fromCategory = worldFromCategoryText(normalized)
  if (fromCategory) return fromCategory

  if (kindFromTechnicalNameSignal(normalized)) return 'technical'

  return 'design'
}

export function resolveProductCatalogKind(product: ProductDetailDTO): ProductCatalogKind {
  const slugOverride = PRODUCT_CATALOG_KIND_BY_SLUG[product.slug]
  if (slugOverride) return slugOverride

  const fromHaystack = worldFromCategoryText(categoryHaystack(product))
  if (fromHaystack) return fromHaystack

  const text = [product.name, product.shortDescription].filter(Boolean).join(' · ')
  const fromName = kindFromTechnicalNameSignal(text)
  if (fromName) return fromName

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
