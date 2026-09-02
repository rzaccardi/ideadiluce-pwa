import { env } from '../../config/env.js'
import { absoluteUrl, productPath, type HubLocale } from '../../lib/hub-locale.js'
import { resolveCatalogProduct, listOdooCatalogProductSlugs } from '../catalog/catalogResolver.service.js'
import type { ProductDetailDTO, ProductVariantDTO } from '../../types/dto.js'
import {
  DEFAULT_MERCHANT_CENTER_SETTINGS,
  getMerchantCenterSettingsDTO,
  type MerchantCenterSettingsDTO,
} from './merchant-center.settings.js'

export type MerchantAvailability = 'in_stock' | 'out_of_stock' | 'backorder'

export type MerchantFeedIssue =
  | 'missing_image'
  | 'missing_gtin'
  | 'zero_price'
  | 'missing_title'
  | 'noindex'

export type MerchantFeedOffer = {
  id: string
  title: string
  description: string
  link: string
  image: string | null
  additionalImages: string[]
  availability: MerchantAvailability
  priceCents: number
  brand: string
  gtin: string | null
  mpn: string | null
  productType: string
  itemGroupId: string | null
}

export type MerchantFeedSampleRow = {
  slug: string
  id: string
  title: string
  feedPrice: string
  availability: MerchantAvailability
  gtin: string | null
  included: boolean
  issues: MerchantFeedIssue[]
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

export function merchantAvailability(product: ProductDetailDTO, variant?: ProductVariantDTO | null): MerchantAvailability {
  const inStock = variant?.inStock ?? product.inStock
  if (inStock) return 'in_stock'
  const orderable = variant?.availability?.isOrderable ?? product.availability?.isOrderable
  if (orderable) return 'backorder'
  return 'out_of_stock'
}

export function collectMerchantFeedIssues(
  product: ProductDetailDTO,
  offer: MerchantFeedOffer,
): MerchantFeedIssue[] {
  const issues: MerchantFeedIssue[] = []
  if (product.seo.noindex) issues.push('noindex')
  if (!offer.title.trim()) issues.push('missing_title')
  if (!offer.image) issues.push('missing_image')
  if (offer.priceCents <= 0) issues.push('zero_price')
  if (!offer.gtin) issues.push('missing_gtin')
  return issues
}

function productDescription(product: ProductDetailDTO): string {
  return stripHtml(
    product.shortDescription ?? product.longDescription ?? product.seo.metaDescription ?? product.name,
  ).slice(0, 5000)
}

function productTypeOf(product: ProductDetailDTO): string {
  return product.categories?.map((c) => c.name).filter(Boolean).join(' > ') ?? ''
}

function shouldIncludeOffer(offer: MerchantFeedOffer, product: ProductDetailDTO, settings: MerchantCenterSettingsDTO): boolean {
  if (product.seo.noindex) return false
  if (!settings.includeOutOfStock && offer.availability === 'out_of_stock') return false
  return true
}

function templateOffer(
  product: ProductDetailDTO,
  siteBase: string,
  settings: MerchantCenterSettingsDTO,
  locale: HubLocale,
): MerchantFeedOffer {
  const link = absoluteUrl(siteBase, productPath(product.slug, locale))
  const image = product.images[0] ?? product.imageUrl
  const mpn = product.manufacturerCode ?? product.sku
  return {
    id: product.sku ?? product.slug,
    title: product.name,
    description: productDescription(product),
    link,
    image,
    additionalImages: product.images.slice(1, 5),
    availability: merchantAvailability(product),
    priceCents: product.priceCents,
    brand: product.brand?.name?.trim() || settings.brandFallback,
    gtin: product.ean ?? null,
    mpn: mpn ?? null,
    productType: productTypeOf(product),
    itemGroupId: null,
  }
}

function variantOffer(
  product: ProductDetailDTO,
  variant: ProductVariantDTO,
  siteBase: string,
  settings: MerchantCenterSettingsDTO,
  locale: HubLocale,
): MerchantFeedOffer {
  const base = templateOffer(product, siteBase, settings, locale)
  const title = variant.label.trim() && variant.label.trim() !== product.name
    ? `${product.name} — ${variant.label.trim()}`
    : product.name
  const image = variant.imageUrl ?? base.image
  const additionalImages = image && image !== base.image
    ? [base.image, ...base.additionalImages].filter((img): img is string => Boolean(img)).slice(0, 5)
    : base.additionalImages
  return {
    ...base,
    id: variant.ced ?? variant.ref,
    title,
    image,
    additionalImages: additionalImages.filter((img) => img !== image).slice(0, 4),
    availability: merchantAvailability(product, variant),
    priceCents: variant.priceCents ?? product.priceCents,
    gtin: variant.ean ?? product.ean ?? null,
    mpn: variant.manufacturerCode ?? product.manufacturerCode ?? product.sku ?? null,
    itemGroupId: product.sku ?? product.slug,
  }
}

export function offersForProduct(
  product: ProductDetailDTO,
  siteBase: string,
  settings: MerchantCenterSettingsDTO,
  locale: HubLocale = 'IT',
): MerchantFeedOffer[] {
  if (settings.expandVariants && product.variants.length > 1) {
    return product.variants.map((variant) => variantOffer(product, variant, siteBase, settings, locale))
  }
  return [templateOffer(product, siteBase, settings, locale)]
}

export function feedItemXml(offer: MerchantFeedOffer, settings: MerchantCenterSettingsDTO): string {
  const price = (offer.priceCents / 100).toFixed(2)
  const shippingPrice =
    settings.shippingPriceCents == null ? null : (settings.shippingPriceCents / 100).toFixed(2)

  const lines = [
    '    <item>',
    `      <g:id>${escapeXml(offer.id)}</g:id>`,
    `      <g:title>${escapeXml(offer.title)}</g:title>`,
    `      <g:description>${escapeXml(offer.description)}</g:description>`,
    `      <g:link>${escapeXml(offer.link)}</g:link>`,
    offer.image ? `      <g:image_link>${escapeXml(offer.image)}</g:image_link>` : null,
    ...offer.additionalImages.map((img) => `      <g:additional_image_link>${escapeXml(img)}</g:additional_image_link>`),
    `      <g:availability>${offer.availability}</g:availability>`,
    `      <g:price>${price} EUR</g:price>`,
    `      <g:brand>${escapeXml(offer.brand)}</g:brand>`,
    `      <g:condition>new</g:condition>`,
    offer.gtin ? `      <g:gtin>${escapeXml(offer.gtin)}</g:gtin>` : '      <g:identifier_exists>false</g:identifier_exists>',
    offer.mpn ? `      <g:mpn>${escapeXml(offer.mpn)}</g:mpn>` : null,
    offer.productType ? `      <g:product_type>${escapeXml(offer.productType)}</g:product_type>` : null,
    settings.googleProductCategory
      ? `      <g:google_product_category>${escapeXml(settings.googleProductCategory)}</g:google_product_category>`
      : null,
    offer.itemGroupId ? `      <g:item_group_id>${escapeXml(offer.itemGroupId)}</g:item_group_id>` : null,
    shippingPrice != null
      ? `      <g:shipping>
        <g:country>${escapeXml(settings.shippingCountry)}</g:country>
        <g:price>${shippingPrice} EUR</g:price>
      </g:shipping>`
      : null,
    '    </item>',
  ].filter(Boolean)

  return lines.join('\n')
}

export function wrapMerchantFeedXml(siteBase: string, itemXml: string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Idea di Luce</title>
    <link>${escapeXml(siteBase)}</link>
    <description>Feed prodotti Idea di Luce</description>
${itemXml.join('\n')}
  </channel>
</rss>`
}

const MERCHANT_FEED_BATCH_SIZE = 8

export async function buildMerchantFeedXml(
  settings?: MerchantCenterSettingsDTO,
): Promise<string> {
  const resolved = settings ?? (await getMerchantCenterSettingsDTO().catch(() => DEFAULT_MERCHANT_CENTER_SETTINGS))
  const siteBase = env.PUBLIC_SITE_URL
  if (!resolved.enabled) {
    return wrapMerchantFeedXml(siteBase, [])
  }

  const slugs = await listOdooCatalogProductSlugs('IT')
  const items: string[] = []

  for (let i = 0; i < slugs.length; i += MERCHANT_FEED_BATCH_SIZE) {
    const batch = slugs.slice(i, i + MERCHANT_FEED_BATCH_SIZE)
    const products = await Promise.all(
      batch.map((slug) => resolveCatalogProduct({ correlationId: 'merchant-feed' }, slug, 'IT')),
    )
    for (const product of products) {
      if (!product) continue
      for (const offer of offersForProduct(product, siteBase, resolved)) {
        if (!shouldIncludeOffer(offer, product, resolved)) continue
        items.push(feedItemXml(offer, resolved))
      }
    }
  }

  return wrapMerchantFeedXml(siteBase, items)
}

export async function validateMerchantFeedSample(limit = 10): Promise<{
  enabled: boolean
  items: MerchantFeedSampleRow[]
}> {
  const settings = await getMerchantCenterSettingsDTO().catch(() => DEFAULT_MERCHANT_CENTER_SETTINGS)
  const siteBase = env.PUBLIC_SITE_URL
  const slugs = (await listOdooCatalogProductSlugs('IT')).slice(0, limit)
  const items: MerchantFeedSampleRow[] = []

  for (const slug of slugs) {
    const product = await resolveCatalogProduct({ correlationId: 'merchant-feed' }, slug, 'IT')
    if (!product) continue
    for (const offer of offersForProduct(product, siteBase, settings)) {
      items.push({
        slug: product.slug,
        id: offer.id,
        title: offer.title,
        feedPrice: (offer.priceCents / 100).toFixed(2),
        availability: offer.availability,
        gtin: offer.gtin,
        included: shouldIncludeOffer(offer, product, settings),
        issues: collectMerchantFeedIssues(product, offer),
      })
    }
  }

  return { enabled: settings.enabled, items }
}
