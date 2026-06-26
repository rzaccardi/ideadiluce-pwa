import { useEffect } from 'react'
import type { ProductAlternateDTO, ProductDetailDTO, ProductSeoDTO } from '@/types/dto'
import { buildProductJsonLd } from '@/lib/seo'

type SeoHeadProps = {
  title: string
  description?: string | null
  canonical?: string | null
  noindex?: boolean
  alternates?: ProductAlternateDTO[]
  ogImage?: string | null
  ogType?: string
  productJsonLd?: ProductDetailDTO | null
}

function upsertLink(rel: string, href: string, hreflang?: string) {
  const selector = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]:not([hreflang])`
  let el = document.head.querySelector(selector) as HTMLLinkElement | null
  if (!el) {
    el = document.createElement('link')
    el.rel = rel
    if (hreflang) el.hreflang = hreflang
    document.head.appendChild(el)
  }
  el.href = href
}

function upsertMeta(name: string, content: string) {
  let el = document.head.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.name = name
    document.head.appendChild(el)
  }
  el.content = content
}

function upsertMetaProperty(property: string, content: string) {
  let el = document.head.querySelector(
    `meta[property="${property}"]`,
  ) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('property', property)
    document.head.appendChild(el)
  }
  el.content = content
}

function removeMetaProperty(property: string) {
  document.head.querySelector(`meta[property="${property}"]`)?.remove()
}

function upsertJsonLd(id: string, data: Record<string, unknown>) {
  const selector = `script[data-seo-jsonld="${id}"]`
  let el = document.head.querySelector(selector) as HTMLScriptElement | null
  if (!el) {
    el = document.createElement('script')
    el.type = 'application/ld+json'
    el.setAttribute('data-seo-jsonld', id)
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(data)
}

function removeJsonLd(id: string) {
  document.head.querySelector(`script[data-seo-jsonld="${id}"]`)?.remove()
}

export function SeoHead({
  title,
  description,
  canonical,
  noindex,
  alternates = [],
  ogImage,
  ogType = 'website',
  productJsonLd,
}: SeoHeadProps) {
  useEffect(() => {
    document.title = title
    if (description) upsertMeta('description', description)
    if (noindex) {
      upsertMeta('robots', 'noindex,nofollow')
    } else {
      document.head.querySelector('meta[name="robots"]')?.remove()
    }
    if (canonical) upsertLink('canonical', canonical)

    upsertMetaProperty('og:title', title)
    if (description) upsertMetaProperty('og:description', description)
    upsertMetaProperty('og:type', ogType)
    if (canonical) upsertMetaProperty('og:url', canonical)
    if (ogImage) {
      upsertMetaProperty('og:image', ogImage)
      upsertMeta('twitter:card', 'summary_large_image')
      upsertMeta('twitter:image', ogImage)
    } else {
      removeMetaProperty('og:image')
    }
    upsertMeta('twitter:title', title)
    if (description) upsertMeta('twitter:description', description)

    document.querySelectorAll('link[rel="alternate"][hreflang]').forEach((n) => n.remove())
    for (const alt of alternates) {
      upsertLink('alternate', alt.href, alt.locale)
    }
    if (alternates.length) {
      const it = alternates.find((a) => a.locale === 'it') ?? alternates[0]
      upsertLink('alternate', it.href, 'x-default')
    }

    if (productJsonLd && !noindex) {
      const pageUrl = canonical ?? window.location.href
      upsertJsonLd('product', buildProductJsonLd(productJsonLd, pageUrl))
    } else {
      removeJsonLd('product')
    }

    return () => {
      removeJsonLd('product')
    }
  }, [title, description, canonical, noindex, alternates, ogImage, ogType, productJsonLd])

  return null
}

export function productSeoFromDto(seo: ProductSeoDTO | undefined, fallbackTitle: string) {
  return {
    title: seo?.metaTitle?.trim() || fallbackTitle,
    description: seo?.metaDescription?.trim() || null,
    canonical: seo?.canonical?.startsWith('http')
      ? seo.canonical
      : seo?.canonical
        ? `${window.location.origin}${seo.canonical.startsWith('/') ? '' : '/'}${seo.canonical}`
        : null,
    noindex: seo?.noindex ?? false,
  }
}
