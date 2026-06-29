import { SITE_LOCALES } from '../site/site.constants.js'
import { siteRepository } from '../site/site.repository.js'
import { upsertSeoRedirect } from '../seo/seo-redirect.service.js'
import { refreshSeoCaches } from '../seo/seo-cache.service.js'
import {
  LEGACY_EDITORIAL_GUIDE_REDIRECTS,
  LEGACY_EDITORIAL_GUIDE_SLUGS,
  getLegacyEditorialGuideContent,
  legacyEditorialGuidePageKey,
} from './legacy-editorial-guides.content.js'

/** Importa articoli editoriali legacy (WordPress) con traduzioni e redirect 301. */
export async function seedLegacyEditorialGuides() {
  for (const slug of LEGACY_EDITORIAL_GUIDE_SLUGS) {
    const pageKey = legacyEditorialGuidePageKey(slug)
    for (const locale of SITE_LOCALES) {
      const existing = await siteRepository.findByKeyLocale(pageKey, locale)
      const content = getLegacyEditorialGuideContent(slug, locale)
      const needsImageUpgrade =
        existing &&
        typeof existing.content === 'object' &&
        existing.content !== null &&
        !('coverImage' in (existing.content as Record<string, unknown>))
      if (existing && !needsImageUpgrade) continue
      await siteRepository.upsert(pageKey, locale, content, true)
    }
  }

  for (const redirect of LEGACY_EDITORIAL_GUIDE_REDIRECTS) {
    await upsertSeoRedirect({
      fromPath: redirect.fromPath,
      toPath: redirect.toPath,
      statusCode: 301,
      reason: redirect.reason,
    })
  }

  void refreshSeoCaches().catch(() => undefined)
}
