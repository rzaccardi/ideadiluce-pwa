import type { HubLocale } from '../../lib/hub-locale.js'
import { env } from '../../config/env.js'
import type {
  ProductAlternateDTO,
  ProductBrandDTO,
  ProductCardDTO,
  ProductCategoryRefDTO,
  ProductDetailDTO,
  ProductRelatedDTO,
  ProductVariantAttributeDTO,
  ProductVariantDTO,
} from '../../types/dto.js'
import {
  deriveInStockFromAvailability,
  parseArflyAvailability,
  parseArflyDocuments,
} from './arflyParsers.js'
import type {
  ArflyDimensions,
  ArflyProductDetail,
  ArflyProductListItem,
  ArflyRelatedProduct,
} from './arfly.types.js'

function mediaUrl(path: string | null | undefined): string | null {
  if (!path?.trim()) return null
  if (/^https?:\/\//i.test(path)) return path
  const base = env.ARFLY_API_BASE_URL?.trim().replace(/\/$/, '')
  return base ? `${base}${path.startsWith('/') ? path : `/${path}`}` : path
}

function eurosToCents(value: number): number {
  return Math.round(value * 100)
}

function availabilityFlat(source: {
  qty_available?: number
  is_orderable?: boolean
}) {
  return {
    qty_available: source.qty_available,
    is_orderable: source.is_orderable,
  }
}

function mapCategories(
  categories: ArflyProductListItem['categories'],
): ProductCategoryRefDTO[] {
  if (!categories?.length) return []
  return categories
    .filter((c) => c.slug && c.name)
    .map((c) => ({ slug: c.slug!, name: c.name! }))
}

function mapBrand(brand: ArflyProductListItem['brand']): ProductBrandDTO | null {
  if (!brand?.slug || !brand?.name) return null
  return { slug: brand.slug, name: brand.name }
}

function variantLabel(attributes: ProductVariantAttributeDTO[], ced: string): string {
  if (attributes.length) {
    return attributes.map((a) => `${a.name}: ${a.value}`).join(' · ')
  }
  return ced || 'Variante'
}

function normalizeRelation(
  value: string | undefined,
  fallback: ProductRelatedDTO['relation'],
): ProductRelatedDTO['relation'] {
  if (value === 'accessory' || value === 'alternative' || value === 'related') return value
  return fallback
}

function relatedToListItem(item: ArflyRelatedProduct): ArflyProductListItem {
  return {
    id: 0,
    title: item.title ?? item.slug ?? '',
    slug: item.slug ?? '',
    short_description: item.short_description ?? '',
    price_from: item.price_from ?? 0,
    price_to: item.price_from ?? 0,
    currency: item.currency ?? 'EUR',
    image: item.image ?? { url: '', alt: '' },
    availability: item.availability,
    qty_available: item.qty_available,
  }
}

function mapDimensions(dimensions?: ArflyDimensions): ProductDetailDTO['dimensions'] {
  if (!dimensions) return undefined
  const mapped: NonNullable<ProductDetailDTO['dimensions']> = {}
  if (dimensions.length_cm != null) mapped.lengthCm = dimensions.length_cm
  if (dimensions.width_cm != null) mapped.widthCm = dimensions.width_cm
  if (dimensions.height_cm != null) mapped.heightCm = dimensions.height_cm
  return Object.keys(mapped).length ? mapped : undefined
}

function mapAlternates(
  alternates: ArflyProductDetail['seo']['alternates'],
): ProductAlternateDTO[] {
  if (!alternates?.length) return []
  const mapped: ProductAlternateDTO[] = []
  for (const alt of alternates) {
    const locale = alt.locale ?? alt.lang
    const href = alt.href ?? alt.url
    if (locale && href) mapped.push({ locale, href })
  }
  return mapped
}

function mapRelatedProduct(
  item: ArflyRelatedProduct,
  locale: HubLocale,
  relation: ProductRelatedDTO['relation'],
): ProductRelatedDTO {
  return {
    ...mapArflyListItem(relatedToListItem(item), locale),
    relation: normalizeRelation(item.relation, relation),
  }
}

export function mapArflyListItem(product: ArflyProductListItem, locale: HubLocale): ProductCardDTO {
  const availability = parseArflyAvailability(
    product.availability,
    availabilityFlat(product),
  )
  const categories = mapCategories(product.categories)

  return {
    slug: product.slug,
    locale,
    name: product.title,
    shortDescription: product.short_description || null,
    priceCents: eurosToCents(product.price_from),
    priceDisplayMode: 'ex_vat',
    currency: product.currency || 'EUR',
    imageUrl: mediaUrl(product.image?.url),
    categorySlug: categories[0]?.slug ?? product.category_slug ?? null,
    availability,
    inStock: deriveInStockFromAvailability(availability),
  }
}

export function mapArflyProductDetail(
  product: ArflyProductDetail,
  locale: HubLocale,
): ProductDetailDTO {
  const card = mapArflyListItem(product, locale)
  const gallery = product.gallery
    .map((g) => mediaUrl(g.url))
    .filter((u): u is string => Boolean(u))
  const images = gallery.length ? gallery : card.imageUrl ? [card.imageUrl] : []

  const templateAvailability =
    parseArflyAvailability(product.availability, availabilityFlat(product)) ?? card.availability
  const templateDocuments = parseArflyDocuments(product.documents)

  const variants: ProductVariantDTO[] = product.variants.map((v) => {
    const attributes: ProductVariantAttributeDTO[] = v.attributes.map((a) => ({
      name: a.label,
      value: a.value,
    }))
    const availability =
      parseArflyAvailability(v.availability, availabilityFlat(v)) ?? templateAvailability
    return {
      ref: String(v.id),
      label: variantLabel(attributes, v.ced),
      imageUrl: mediaUrl(v.image?.url),
      attributes,
      odooVariantId: v.id,
      priceCents: eurosToCents(v.lst_price),
      priceDisplayMode: 'ex_vat',
      stockQty: availability?.qtyAvailable ?? null,
      availability,
      ean: v.ean ?? null,
      documents: parseArflyDocuments(v.documents),
      inStock: deriveInStockFromAvailability(availability),
    }
  })

  const related = product.related_products ?? []
  const relatedProducts = related
    .filter((r) => normalizeRelation(r.relation, 'related') === 'related')
    .map((r) => mapRelatedProduct(r, locale, 'related'))
  const accessories = related
    .filter((r) => normalizeRelation(r.relation, 'related') === 'accessory')
    .map((r) => mapRelatedProduct(r, locale, 'accessory'))
  const alternatives = related
    .filter((r) => normalizeRelation(r.relation, 'related') === 'alternative')
    .map((r) => mapRelatedProduct(r, locale, 'alternative'))

  return {
    ...card,
    longDescription: product.description || null,
    sku: product.variants[0]?.ced ?? null,
    inStock: deriveInStockFromAvailability(templateAvailability),
    images,
    categories: mapCategories(product.categories),
    brand: mapBrand(product.brand),
    odooTemplateId: product.id,
    variants,
    availability: templateAvailability,
    documents: templateDocuments,
    relatedProducts,
    accessories,
    alternatives,
    ean: product.ean ?? product.variants[0]?.ean ?? null,
    weightKg: product.weight_kg ?? null,
    lengthMeters:
      product.length_meters ??
      (product.dimensions?.length_cm != null ? product.dimensions.length_cm / 100 : null),
    dimensions: mapDimensions(product.dimensions),
    priceLabel: 'excl_vat',
    seo: {
      metaTitle: product.seo?.meta_title ?? product.title,
      metaDescription: product.seo?.meta_description ?? null,
      canonical: null,
      noindex: false,
    },
    alternates: mapAlternates(product.seo?.alternates),
  }
}

export function mapArflyListResponse(
  raw: { items: ArflyProductListItem[]; page: number; per_page: number; total: number; total_pages: number },
  locale: HubLocale,
) {
  const items = raw.items.map((item) => mapArflyListItem(item, locale))
  return {
    items,
    page: raw.page,
    pageSize: raw.per_page,
    total: raw.total,
    totalPages: raw.total_pages,
    hasNextPage: raw.page < raw.total_pages,
    hasPreviousPage: raw.page > 1,
  }
}
