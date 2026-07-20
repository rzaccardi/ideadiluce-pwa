import { localizePath, type PwaLocale } from '@/lib/locale'
import type {
  ProductAlternateDTO,
  ProductBrandDTO,
  ProductCardDTO,
  ProductCategoryRefDTO,
  ProductDetailDTO,
  ProductGalleryItemDTO,
  ProductRelatedDTO,
  ProductSpecDTO,
  ProductVariantAttributeDTO,
  ProductVariantDTO,
} from '@/types/dto'
import { buildTechnicalCardSpecTags } from '@/lib/technical-card-spec-tags'
import { inferTechnicalProductBrandFromName } from '@/lib/technical-product-ref'
import {
  deriveInStockFromAvailability,
  parseOdooCatalogAvailability,
  parseOdooCatalogDocuments,
} from './parsers'
import { resolveOdooCatalogMediaUrl, resolveOdooCatalogMediaUrlWithSize } from './media'
import type {
  OdooCatalogDimensions,
  OdooCatalogGalleryItem,
  OdooCatalogProductDetail,
  OdooCatalogProductListItem,
  OdooCatalogRelatedProduct,
  OdooCatalogSpec,
} from './types'

function eurosToCents(value: number): number {
  return Math.round(value * 100)
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function mapOdooCatalogSpecs(specs: OdooCatalogSpec[] | undefined | null): ProductSpecDTO[] {
  if (!specs?.length) return []
  return specs.map((s) => ({
    key: s.key,
    label: s.label,
    unit: s.unit ?? '',
    valueType: s.value_type,
    cardinality: s.cardinality,
    value: s.value,
    display: s.display,
  }))
}

function specsTableHtml(specs: OdooCatalogSpec[]): string | null {
  if (!specs.length) return null
  const rows = specs
    .map(
      (s) =>
        `<tr><th scope="row">${escapeHtml(s.label)}</th><td>${escapeHtml(s.display)}</td></tr>`,
    )
    .join('')
  return `<table class="product-specs"><tbody>${rows}</tbody></table>`
}

function variantLabel(attributes: ProductVariantAttributeDTO[], ced: string): string {
  if (attributes.length) {
    return attributes.map((a) => `${a.name}: ${a.value}`).join(' · ')
  }
  return ced || 'Variante'
}

function productPath(slug: string, locale: PwaLocale): string {
  return localizePath(`/prodotto/${encodeURIComponent(slug)}`, locale)
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
  categories: OdooCatalogProductListItem['categories'],
): ProductCategoryRefDTO[] {
  if (!categories?.length) return []
  return categories
    .filter((c) => c.slug && c.name)
    .map((c) => ({ slug: c.slug!, name: c.name! }))
}

function trimOrNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed || null
}

function resolveListCodes(product: OdooCatalogProductListItem) {
  return {
    sku:
      trimOrNull(product.sku) ??
      trimOrNull(product.manufacturer_code) ??
      trimOrNull(product.ced),
    ced: trimOrNull(product.ced),
    manufacturerCode: trimOrNull(product.manufacturer_code),
    ean: trimOrNull(product.ean),
  }
}

function resolveListSku(product: OdooCatalogProductListItem): string | null {
  return resolveListCodes(product).sku
}

function mapBrand(brand: OdooCatalogProductListItem['brand']): ProductBrandDTO | null {
  if (!brand?.slug || !brand?.name) return null
  return { slug: brand.slug, name: brand.name }
}

function resolveCardBrand(product: OdooCatalogProductListItem): ProductBrandDTO | null {
  return mapBrand(product.brand) ?? inferTechnicalProductBrandFromName(product.title)
}

function normalizeRelation(
  value: string | undefined,
  fallback: ProductRelatedDTO['relation'],
): ProductRelatedDTO['relation'] {
  if (value === 'accessory' || value === 'alternative' || value === 'related') return value
  return fallback
}

function relatedToListItem(item: OdooCatalogRelatedProduct): OdooCatalogProductListItem {
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

function mapDimensions(dimensions?: OdooCatalogDimensions): ProductDetailDTO['dimensions'] {
  if (!dimensions) return undefined
  const mapped: NonNullable<ProductDetailDTO['dimensions']> = {}
  if (dimensions.length_cm != null) mapped.lengthCm = dimensions.length_cm
  if (dimensions.width_cm != null) mapped.widthCm = dimensions.width_cm
  if (dimensions.height_cm != null) mapped.heightCm = dimensions.height_cm
  return Object.keys(mapped).length ? mapped : undefined
}

function mapAlternates(
  alternates: OdooCatalogProductDetail['seo']['alternates'],
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
  item: OdooCatalogRelatedProduct,
  locale: PwaLocale,
  relation: ProductRelatedDTO['relation'],
): ProductRelatedDTO {
  return {
    ...mapOdooCatalogListItem(relatedToListItem(item), locale),
    relation: normalizeRelation(item.relation, relation),
  }
}

function normalizeGalleryItem(item: OdooCatalogGalleryItem | { url: string; alt?: string }): OdooCatalogGalleryItem {
  if ('type' in item && item.type) {
    return {
      type: item.type === 'video' ? 'video' : 'image',
      tag: item.tag || 'foto',
      url: item.url,
      alt: item.alt ?? '',
    }
  }
  return {
    type: 'image',
    tag: 'foto',
    url: item.url,
    alt: 'alt' in item ? (item.alt ?? '') : '',
  }
}

function mapGallery(raw: OdooCatalogProductDetail['gallery']): ProductGalleryItemDTO[] {
  if (!raw?.length) return []
  const items: ProductGalleryItemDTO[] = []
  for (const entry of raw) {
    const g = normalizeGalleryItem(entry)
    const size = g.type === 'image' ? 'image_1920' : undefined
    const url =
      g.type === 'video'
        ? resolveOdooCatalogMediaUrl(g.url)
        : resolveOdooCatalogMediaUrlWithSize(g.url, size!)
    if (!url) continue
    items.push({
      type: g.type,
      tag: g.tag || 'foto',
      url,
      alt: g.alt ?? '',
    })
  }
  return items
}

export function mapOdooCatalogListItem(product: OdooCatalogProductListItem, locale: PwaLocale): ProductCardDTO {
  const availability = parseOdooCatalogAvailability(
    product.availability,
    availabilityFlat(product),
  )
  const categories = mapCategories(product.categories)
  const specTags = buildTechnicalCardSpecTags({
    name: product.title,
    shortDescription: product.short_description || null,
    specs: product.specs,
    specTags: product.spec_tags,
  })

  const codes = resolveListCodes(product)

  return {
    slug: product.slug,
    locale,
    name: product.title,
    shortDescription: product.short_description || null,
    specTags: specTags.length ? specTags : undefined,
    priceCents: eurosToCents(product.price_from),
    priceDisplayMode: 'ex_vat',
    currency: product.currency || 'EUR',
    imageUrl: resolveOdooCatalogMediaUrlWithSize(product.image?.url, 'image_512'),
    categorySlug: categories[0]?.slug ?? product.category_slug ?? null,
    brand: resolveCardBrand(product),
    sku: resolveListSku(product),
    ced: codes.ced,
    manufacturerCode: codes.manufacturerCode,
    defaultCode: null,
    ean: codes.ean,
    availability,
    inStock: deriveInStockFromAvailability(availability),
  }
}

export function mapOdooCatalogProductDetail(
  product: OdooCatalogProductDetail,
  locale: PwaLocale,
): ProductDetailDTO {
  const card = mapOdooCatalogListItem(product, locale)
  const gallery = mapGallery(product.gallery)
  const images = gallery
    .filter((g) => g.type === 'image')
    .map((g) => g.url)
  const imageFallback = images.length ? images : card.imageUrl ? [card.imageUrl] : []

  const templateAvailability =
    parseOdooCatalogAvailability(product.availability, availabilityFlat(product)) ?? card.availability
  const templateCed = trimOrNull(product.variants?.[0]?.ced) ?? card.ced
  const templateDocuments = parseOdooCatalogDocuments(product.documents, { ced: templateCed })
  const templateSpecs = mapOdooCatalogSpecs(product.specs)

  const variants: ProductVariantDTO[] = (product.variants ?? []).map((v) => {
    const attributes: ProductVariantAttributeDTO[] = (v.attributes ?? []).map((a) => ({
      name: a.label,
      value: a.value,
    }))
    const availability =
      parseOdooCatalogAvailability(v.availability, availabilityFlat(v)) ?? templateAvailability
    const ced = trimOrNull(v.ced)
    return {
      ref: String(v.id),
      label: variantLabel(attributes, v.ced ?? ''),
      imageUrl: resolveOdooCatalogMediaUrlWithSize(v.image?.url, 'image_512'),
      attributes,
      odooVariantId: v.id,
      priceCents: eurosToCents(v.lst_price),
      priceDisplayMode: 'ex_vat',
      stockQty: availability?.qtyAvailable ?? null,
      availability,
      ean: trimOrNull(v.ean),
      ced,
      manufacturerCode: trimOrNull(v.manufacturer_code),
      specs: mapOdooCatalogSpecs(v.specs),
      documents: parseOdooCatalogDocuments(v.documents, { ced }),
      inStock: deriveInStockFromAvailability(availability),
    }
  })

  const primarySku =
    trimOrNull(product.variants?.[0]?.manufacturer_code) ??
    trimOrNull(product.variants?.[0]?.ced) ??
    resolveListSku(product)
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
    additionalInfoTableHtml: null,
    specsTableHtml: specsTableHtml(product.specs ?? []),
    specs: templateSpecs,
    sku: primarySku,
    ced: templateCed ?? null,
    manufacturerCode:
      trimOrNull(product.variants?.[0]?.manufacturer_code) ?? card.manufacturerCode ?? null,
    defaultCode: null,
    inStock: deriveInStockFromAvailability(templateAvailability),
    images: imageFallback,
    gallery,
    categories: mapCategories(product.categories),
    brand: mapBrand(product.brand),
    odooTemplateId: product.id,
    variants,
    availability: templateAvailability,
    documents: templateDocuments,
    relatedProducts,
    accessories,
    alternatives,
    ean:
      trimOrNull(product.ean) ??
      trimOrNull(product.variants?.[0]?.ean) ??
      card.ean ??
      null,
    weightKg: product.weight_kg ?? null,
    lengthMeters:
      product.length_meters ??
      (product.dimensions?.length_cm != null ? product.dimensions.length_cm / 100 : null),
    dimensions: mapDimensions(product.dimensions),
    priceLabel: 'excl_vat',
    seo: {
      metaTitle: product.seo?.meta_title ?? product.title,
      metaDescription: product.seo?.meta_description ?? product.short_description ?? null,
      canonical: productPath(product.slug, locale),
      noindex: false,
    },
    alternates: mapAlternates(product.seo?.alternates),
  }
}

export function mapOdooCatalogListResponse(
  response: { items: OdooCatalogProductListItem[]; page: number; per_page: number; total: number; total_pages: number },
  locale: PwaLocale,
) {
  const items = response.items.map((item) => mapOdooCatalogListItem(item, locale))
  return {
    items,
    page: response.page,
    pageSize: response.per_page,
    total: response.total,
    totalPages: response.total_pages,
    hasNextPage: response.page < response.total_pages,
    hasPreviousPage: response.page > 1,
  }
}
