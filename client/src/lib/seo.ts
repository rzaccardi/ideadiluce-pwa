import type { Metadata } from 'next'
import type { ProductAlternateDTO, ProductDetailDTO, ProductSeoDTO } from '@/types/dto'
import {
  getProductAvailabilityStatus,
  resolveAvailabilityData,
} from '@/lib/product-availability'
import { getSiteUrl } from '@/lib/env'

export function productSeoFromDto(
  seo: ProductSeoDTO | undefined,
  fallbackTitle: string,
  siteUrl?: string,
) {
  const origin = siteUrl ?? getSiteUrl()
  return {
    title: seo?.metaTitle?.trim() || fallbackTitle,
    description: seo?.metaDescription?.trim() || null,
    canonical: seo?.canonical?.startsWith('http')
      ? seo.canonical
      : seo?.canonical
        ? `${origin}${seo.canonical.startsWith('/') ? '' : '/'}${seo.canonical}`
        : null,
    noindex: seo?.noindex ?? false,
  }
}

type SupportedOpenGraphType = 'website' | 'article'

function resolveOpenGraphType(ogType?: string): SupportedOpenGraphType {
  if (ogType === 'article') return 'article'
  return 'website'
}

export function buildMetadata(input: {
  title: string
  description?: string | null
  canonical?: string | null
  noindex?: boolean
  alternates?: ProductAlternateDTO[]
  ogImage?: string | null
  /** Next.js accetta solo tipi OG limitati (es. website, article) — non `product`. */
  ogType?: string
}): Metadata {
  const { title, description, canonical, noindex, alternates = [], ogImage, ogType } = input

  const languages: Record<string, string> = {}
  for (const alt of alternates) {
    languages[alt.locale] = alt.href
  }
  if (alternates.length) {
    const it = alternates.find((a) => a.locale === 'it') ?? alternates[0]
    languages['x-default'] = it.href
  }

  return {
    title,
    description: description ?? undefined,
    robots: noindex ? { index: false, follow: false } : undefined,
    alternates: {
      canonical: canonical ?? undefined,
      languages: Object.keys(languages).length ? languages : undefined,
    },
    openGraph: {
      title,
      description: description ?? undefined,
      type: resolveOpenGraphType(ogType),
      url: canonical ?? undefined,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title,
      description: description ?? undefined,
      images: ogImage ? [ogImage] : undefined,
    },
  }
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

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDescription ?? product.seo.metaDescription ?? undefined,
    sku: product.sku ?? undefined,
    image: images,
    offers: {
      '@type': 'Offer',
      url: pageUrl,
      priceCurrency: product.currency,
      price: (priceCents / 100).toFixed(2),
      availability: availability.schemaOrgAvailability,
    },
  }
}
