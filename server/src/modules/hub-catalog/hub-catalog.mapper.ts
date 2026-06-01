import type {
  ProductCardDTO,
  ProductVariantAttributeDTO,
} from '../../types/dto.js'
import { formatOdooVariantRef } from '../catalog/odooRef.js'
import type { HubProductDetailDTO, HubProductVariantDTO } from './hub-catalog.types.js'

type ProductRow = {
  slug: string
  sku: string | null
  ogImageUrl: string | null
  shortDescription: string | null
  longDescription: string | null
  purchasable: boolean
  odooTemplateId: number | null
  seo: { translations: { metaTitle: string | null; metaDescription: string | null }[] } | null
  categories: { category: { slug: string } }[]
  media: { url: string; kind: string; sortOrder: number }[]
  variants: Array<{
    wooPostId: number
    odooVariantId: number | null
    slug: string
    sku: string | null
    attributes: { name: string; value: string }[]
    media: { url: string }[]
  }>
}

function humanizeSlug(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function productName(
  seo: ProductRow['seo'],
  slug: string,
): string {
  const title = seo?.translations[0]?.metaTitle
  if (title && !title.includes('%%')) {
    return title.replace(/\s*-\s*IdeaDiLuce.*$/i, '').trim() || humanizeSlug(slug)
  }
  return humanizeSlug(slug)
}

function productImages(
  media: ProductRow['media'],
  fallback: string | null,
): string[] {
  const ordered = [...media]
    .filter((m) => m.kind === 'COVER' || m.kind === 'GALLERY')
    .sort((a, b) => a.sortOrder - b.sortOrder)
  const urls = ordered.map((m) => m.url)
  if (!urls.length && fallback) return [fallback]
  return urls
}

function variantLabel(
  attrs: ProductVariantAttributeDTO[],
  sku: string | null,
  slug: string,
): string {
  if (attrs.length) {
    return attrs.map((a) => `${a.name}: ${a.value}`).join(' · ')
  }
  if (sku) return sku.split('|').map((s) => s.trim())[0] ?? sku
  return humanizeSlug(slug)
}

function mapVariants(variants: ProductRow['variants']): HubProductVariantDTO[] {
  return variants.map((v) => {
    const attrs: ProductVariantAttributeDTO[] = v.attributes.map((a) => ({
      name: a.name,
      value: a.value,
    }))
    const odooVariantId = v.odooVariantId
    return {
      ref:
        odooVariantId != null
          ? formatOdooVariantRef(odooVariantId)
          : `woo-${v.wooPostId}`,
      label: variantLabel(attrs, v.sku, v.slug),
      imageUrl: v.media[0]?.url ?? null,
      attributes: attrs,
      odooVariantId,
    }
  })
}

export function mapHubProduct(p: ProductRow): HubProductDetailDTO {
  const tr = p.seo?.translations[0]
  const images = productImages(p.media, p.ogImageUrl)
  const cover = images[0] ?? p.ogImageUrl
  const variants = mapVariants(p.variants)

  return {
    slug: p.slug,
    name: productName(p.seo, p.slug),
    shortDescription:
      p.shortDescription?.slice(0, 200) ?? tr?.metaDescription?.slice(0, 200) ?? null,
    longDescription: p.longDescription ?? tr?.metaDescription ?? null,
    priceCents: 0,
    currency: 'EUR',
    imageUrl: cover,
    images,
    categorySlug: p.categories[0]?.category.slug ?? null,
    sku: p.sku,
    inStock: p.purchasable,
    odooTemplateId: p.odooTemplateId,
    variants,
  }
}

export function mapHubListCard(p: ProductRow): ProductCardDTO {
  const cover = p.media[0]?.url ?? p.ogImageUrl
  return {
    slug: p.slug,
    name: productName(p.seo, p.slug),
    shortDescription:
      p.shortDescription?.slice(0, 200) ??
      p.seo?.translations[0]?.metaDescription?.slice(0, 200) ??
      null,
    priceCents: 0,
    currency: 'EUR',
    imageUrl: cover,
    categorySlug: p.categories[0]?.category.slug ?? null,
  }
}

export function hubSnapshotForList(p: ProductRow): HubProductDetailDTO {
  const full = mapHubProduct(p)
  return {
    ...full,
    images: full.imageUrl ? [full.imageUrl] : [],
    variants: full.variants.slice(0, 1) as HubProductVariantDTO[],
  }
}
