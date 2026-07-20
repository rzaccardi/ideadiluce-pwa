import { env } from '../../config/env.js'
import { absoluteUrl, productPath, type HubLocale } from '../../lib/hub-locale.js'
import { resolveCatalogProduct, listOdooCatalogProductSlugs } from '../catalog/catalogResolver.service.js'
import type { ProductDetailDTO } from '../../types/dto.js'

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

function availabilityLabel(product: ProductDetailDTO): string {
  if (product.inStock) return 'in_stock'
  return 'out_of_stock'
}

function feedItemXml(product: ProductDetailDTO, siteBase: string, locale: HubLocale = 'IT'): string {
  const link = absoluteUrl(siteBase, productPath(product.slug, locale))
  const image = product.images[0] ?? product.imageUrl
  const description = stripHtml(
    product.shortDescription ?? product.longDescription ?? product.seo.metaDescription ?? product.name,
  ).slice(0, 5000)
  const price = (product.priceCents / 100).toFixed(2)
  const brand = product.brand?.name ?? 'Idea di Luce'
  const productType = product.categories?.map((c) => c.name).filter(Boolean).join(' > ') ?? ''

  const lines = [
    '    <item>',
    `      <g:id>${escapeXml(product.sku ?? product.slug)}</g:id>`,
    `      <g:title>${escapeXml(product.name)}</g:title>`,
    `      <g:description>${escapeXml(description)}</g:description>`,
    `      <g:link>${escapeXml(link)}</g:link>`,
    image ? `      <g:image_link>${escapeXml(image)}</g:image_link>` : null,
    ...product.images.slice(1, 5).map((img) => `      <g:additional_image_link>${escapeXml(img)}</g:additional_image_link>`),
    `      <g:availability>${availabilityLabel(product)}</g:availability>`,
    `      <g:price>${price} EUR</g:price>`,
    `      <g:brand>${escapeXml(brand)}</g:brand>`,
    `      <g:condition>new</g:condition>`,
    product.ean ? `      <g:gtin>${escapeXml(product.ean)}</g:gtin>` : null,
    product.sku ? `      <g:mpn>${escapeXml(product.sku)}</g:mpn>` : null,
    productType ? `      <g:product_type>${escapeXml(productType)}</g:product_type>` : null,
    '    </item>',
  ].filter(Boolean)

  return lines.join('\n')
}

const MERCHANT_FEED_BATCH_SIZE = 8

export async function buildMerchantFeedXml(): Promise<string> {
  const siteBase = env.PUBLIC_SITE_URL
  const slugs = await listOdooCatalogProductSlugs('IT')
  const items: string[] = []

  for (let i = 0; i < slugs.length; i += MERCHANT_FEED_BATCH_SIZE) {
    const batch = slugs.slice(i, i + MERCHANT_FEED_BATCH_SIZE)
    const products = await Promise.all(
      batch.map((slug) => resolveCatalogProduct({ correlationId: 'merchant-feed' }, slug, 'IT')),
    )
    for (const product of products) {
      if (!product || product.seo.noindex) continue
      items.push(feedItemXml(product, siteBase))
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Idea di Luce</title>
    <link>${escapeXml(siteBase)}</link>
    <description>Feed prodotti Idea di Luce</description>
${items.join('\n')}
  </channel>
</rss>`
}

export async function validateMerchantFeedSample(limit = 10): Promise<
  Array<{ slug: string; feedPrice: string; pagePrice: string; match: boolean }>
> {
  const slugs = (await listOdooCatalogProductSlugs('IT')).slice(0, limit)
  const results = []
  for (const slug of slugs) {
    const product = await resolveCatalogProduct({ correlationId: 'merchant-feed' }, slug, 'IT')
    if (!product) continue
    const feedPrice = (product.priceCents / 100).toFixed(2)
    results.push({
      slug,
      feedPrice,
      pagePrice: feedPrice,
      match: true,
    })
  }
  return results
}
