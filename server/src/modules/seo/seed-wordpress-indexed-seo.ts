import { prisma } from '../../lib/prisma.js'
import { upsertSeoRedirect } from './seo-redirect.service.js'
import { refreshSeoCaches } from './seo-cache.service.js'
import { listWpIndexedRedirects } from './wp-url-mapping.js'
import { WORDPRESS_INDEXED_PATHS } from './wordpress-indexed-paths.js'

export type SeedWordpressIndexedSeoResult = {
  totalPaths: number
  redirectsApplied: number
  categoryRedirectsRemoved: number
  skipped: number
}

/** Rimuove redirect obsoleti che spostavano URL categoria indicizzati. */
async function cleanupCategoriaProdottoRedirects(): Promise<number> {
  const result = await prisma.seoRedirect.deleteMany({
    where: {
      fromPath: { startsWith: '/categoria-prodotto' },
    },
  })
  return result.count
}

/**
 * Applica redirect 301 per URL WordPress indicizzati non serviti in-place.
 * Le categorie /categoria-prodotto/... restano sulla stessa URL (nessun redirect).
 */
export async function seedWordpressIndexedSeoRedirects(): Promise<SeedWordpressIndexedSeoResult> {
  const categoryRedirectsRemoved = await cleanupCategoriaProdottoRedirects()
  const redirects = listWpIndexedRedirects([...WORDPRESS_INDEXED_PATHS])
  let applied = 0

  for (const redirect of redirects) {
    if (!redirect.toPath) continue
    await upsertSeoRedirect({
      fromPath: redirect.fromPath,
      toPath: redirect.toPath,
      statusCode: redirect.statusCode,
      reason: redirect.reason,
    })
    applied += 1
  }

  void refreshSeoCaches().catch(() => undefined)

  return {
    totalPaths: WORDPRESS_INDEXED_PATHS.length,
    redirectsApplied: applied,
    categoryRedirectsRemoved,
    skipped: WORDPRESS_INDEXED_PATHS.length - applied,
  }
}
