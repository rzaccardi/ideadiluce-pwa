import { env } from '../config/env.js'
import type { ProductAlternateDTO, ProductSeoDTO } from '../types/dto.js'
import { absoluteUrl, HREFLANG_CODE, HUB_LOCALES, productPath, type HubLocale } from './hub-locale.js'

export function defaultProductSeo(
  name: string,
  slug: string,
  shortDescription: string | null,
  locale: HubLocale = 'IT',
): ProductSeoDTO {
  return {
    metaTitle: name,
    metaDescription: shortDescription,
    canonical: productPath(slug, locale),
    noindex: false,
  }
}

export function defaultProductAlternates(slug: string): ProductAlternateDTO[] {
  return HUB_LOCALES.map((locale) => ({
    locale: HREFLANG_CODE[locale],
    href: absoluteUrl(env.PUBLIC_SITE_URL, productPath(slug, locale)),
  }))
}
