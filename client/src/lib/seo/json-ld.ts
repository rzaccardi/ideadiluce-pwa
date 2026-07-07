import type { ProductCardDTO, ProductDetailDTO } from '@/types/dto'
import {
  getProductAvailabilityStatus,
  resolveAvailabilityData,
} from '@/lib/product-availability'
import { getSiteUrl } from '@/lib/env'
import { localizePath, type PwaLocale } from '@/lib/locale'
import { productSeoPath } from '@/lib/seo-paths'

export type BreadcrumbItem = {
  name: string
  url?: string
}

export function buildProductJsonLd(
  product: ProductDetailDTO,
  pageUrl: string,
  options?: { variantRef?: string | null },
) {
  const images = product.images.length ? product.images : product.imageUrl ? [product.imageUrl] : []
  const selectedVariant =
    options?.variantRef != null
      ? product.variants.find((v) => v.ref === options.variantRef)
      : product.variants.find((v) => v.inStock !== false) ?? product.variants[0]
  const availability = getProductAvailabilityStatus({
    availability: resolveAvailabilityData(product, selectedVariant),
  })
  const priceCents = selectedVariant?.priceCents ?? product.priceCents
  const ean = product.ean ?? selectedVariant?.ean ?? undefined

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDescription ?? product.seo.metaDescription ?? undefined,
    sku: product.sku ?? undefined,
    mpn: product.sku ?? undefined,
    gtin13: ean ?? undefined,
    image: images,
    brand: product.brand?.name
      ? { '@type': 'Brand', name: product.brand.name }
      : undefined,
    offers: {
      '@type': 'Offer',
      url: pageUrl,
      priceCurrency: product.currency,
      price: (priceCents / 100).toFixed(2),
      availability: availability.schemaOrgAvailability,
      itemCondition: 'https://schema.org/NewCondition',
    },
  }
}

export function buildProductPageUrl(slug: string, locale: PwaLocale): string {
  const site = getSiteUrl().replace(/\/$/, '')
  return `${site}${localizePath(productSeoPath(slug), locale)}`
}

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.url ? { item: item.url } : {}),
    })),
  }
}

export function buildOrganizationJsonLd(siteUrl: string) {
  const site = siteUrl.replace(/\/$/, '')
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Idea di Luce',
    url: site,
    logo: `${site}/icons.svg`,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      url: `${site}/contatti`,
    },
  }
}

export function buildWebSiteJsonLd(siteUrl: string) {
  const site = siteUrl.replace(/\/$/, '')
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Idea di Luce',
    description: 'La luce pensata',
    url: site,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${site}/negozio?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function buildCollectionPageJsonLd(input: {
  name: string
  description?: string | null
  url: string
  products?: ProductCardDTO[]
}) {
  const site = getSiteUrl().replace(/\/$/, '')
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: input.name,
    description: input.description ?? undefined,
    url: input.url,
    mainEntity: input.products?.length
      ? {
          '@type': 'ItemList',
          itemListElement: input.products.map((product, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            url: `${site}${localizePath(productSeoPath(product.slug), 'IT')}`,
            name: product.name,
          })),
        }
      : undefined,
  }
}

export function buildArticleJsonLd(input: {
  title: string
  description?: string | null
  url: string
  dateModified?: string | null
  imageUrl?: string | null
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.title,
    description: input.description ?? undefined,
    url: input.url,
    dateModified: input.dateModified ?? undefined,
    image: input.imageUrl ?? undefined,
    publisher: {
      '@type': 'Organization',
      name: 'Idea di Luce',
    },
  }
}

export function buildFaqPageJsonLd(
  faqs: Array<{ question: string; answer: string }>,
) {
  if (!faqs.length) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}
