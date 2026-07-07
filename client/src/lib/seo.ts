import type { Metadata } from 'next'
import type { ProductAlternateDTO, ProductSeoDTO } from '@/types/dto'
import { getSiteUrl } from '@/lib/env'
import {
  DEFAULT_OG_IMAGE_ALT,
  DEFAULT_OG_IMAGE_HEIGHT,
  DEFAULT_OG_IMAGE_WIDTH,
  resolveOgImageUrl,
} from '@/lib/seo/og-image'

export {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
  buildFaqPageJsonLd,
  buildOrganizationJsonLd,
  buildProductJsonLd,
  buildProductPageUrl,
  buildWebSiteJsonLd,
} from '@/lib/seo/json-ld'
export type { BreadcrumbItem } from '@/lib/seo/json-ld'

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
  const resolvedOgImage = resolveOgImageUrl(ogImage)

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
    robots: noindex ? { index: false, follow: true } : undefined,
    alternates: {
      canonical: canonical ?? undefined,
      languages: Object.keys(languages).length ? languages : undefined,
    },
    openGraph: {
      title,
      description: description ?? undefined,
      type: resolveOpenGraphType(ogType),
      url: canonical ?? undefined,
      images: [
        ogImage
          ? { url: resolvedOgImage }
          : {
              url: resolvedOgImage,
              width: DEFAULT_OG_IMAGE_WIDTH,
              height: DEFAULT_OG_IMAGE_HEIGHT,
              alt: DEFAULT_OG_IMAGE_ALT,
            },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: description ?? undefined,
      images: [resolvedOgImage],
    },
  }
}
