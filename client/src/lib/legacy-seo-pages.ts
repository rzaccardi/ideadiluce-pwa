import type { Metadata } from 'next'
import { getSiteUrl } from '@/lib/env'
import { localizePath } from '@/lib/locale'
import { getRequestLocale } from '@/lib/locale-server'
import { buildMetadata } from '@/lib/seo'
import {
  getLegacySeoPage,
  type LegacySeoPageId,
} from '@/lib/legacy-seo-pages.config'

export type { LegacySeoPageId, LegacySeoPageConfig } from '@/lib/legacy-seo-pages.config'
export {
  LEGACY_SEO_PAGES,
  SEO_CANONICAL_ALIAS_REDIRECTS,
  getLegacySeoPage,
  legacySeoPath,
} from '@/lib/legacy-seo-pages.config'

export async function buildLegacySeoMetadata(
  id: LegacySeoPageId,
  overrides?: Partial<{ title: string; description: string }> & {
    noindex?: boolean
    canonical?: string | null
  },
): Promise<Metadata> {
  const locale = await getRequestLocale()
  const page = getLegacySeoPage(id)
  const site = getSiteUrl().replace(/\/$/, '')
  const canonical =
    overrides?.canonical === null
      ? null
      : (overrides?.canonical ?? `${site}${localizePath(page.canonicalPath, locale)}`)

  return buildMetadata({
    title: overrides?.title ?? page.title,
    description: overrides?.description ?? page.description,
    canonical,
    noindex: overrides?.noindex,
    ogType: page.ogType,
  })
}
