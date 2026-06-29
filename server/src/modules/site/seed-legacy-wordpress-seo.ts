import { upsertSeoRedirect, deleteSeoRedirect } from '../seo/seo-redirect.service.js'
import { refreshSeoCaches } from '../seo/seo-cache.service.js'

/** Alias interni → slug canonico WordPress (301). */
export const SEO_CANONICAL_ALIAS_REDIRECTS: Array<{
  fromPath: string
  toPath: string
  reason: string
}> = [
  {
    fromPath: '/categoria-prodotto/illuminazione-arredo',
    toPath: '/illuminazione-arredo',
    reason: 'Alias PWA → slug WordPress indicizzato',
  },
  {
    fromPath: '/ambienti',
    toPath: '/acquista-ambiente',
    reason: 'Alias PWA → slug WordPress indicizzato',
  },
  {
    fromPath: '/privacy',
    toPath: '/privacy-policy',
    reason: 'Alias PWA → slug WordPress indicizzato',
  },
  {
    fromPath: '/catalogo',
    toPath: '/negozio',
    reason: 'Alias PWA → slug WordPress indicizzato',
  },
  {
    fromPath: '/catalog',
    toPath: '/negozio',
    reason: 'Alias EN → slug WordPress indicizzato',
  },
  {
    fromPath: '/guide',
    toPath: '/blog',
    reason: 'Alias PWA → slug WordPress indicizzato',
  },
  {
    fromPath: '/termini',
    toPath: '/tos',
    reason: 'Alias PWA → slug WordPress indicizzato',
  },
  {
    fromPath: '/prodotto-non-trovato',
    toPath: '/on-demand',
    reason: 'Alias PWA → slug WordPress indicizzato',
  },
  {
    fromPath: '/sample-page',
    toPath: '/chi-siamo',
    reason: 'WordPress placeholder → chi siamo',
  },
]

/** Redirect obsoleti (vecchio slug → alias interno) da eliminare. */
const OBSOLETE_LEGACY_FORWARD_REDIRECTS = [
  '/illuminazione-arredo',
  '/acquista-ambiente',
  '/privacy-policy',
  '/sample-page',
  '/negozio',
  '/blog',
  '/tos',
  '/on-demand',
] as const

export async function seedLegacyWordpressSeoRedirects() {
  for (const fromPath of OBSOLETE_LEGACY_FORWARD_REDIRECTS) {
    await deleteSeoRedirect(fromPath).catch(() => undefined)
  }

  for (const redirect of SEO_CANONICAL_ALIAS_REDIRECTS) {
    await upsertSeoRedirect({
      fromPath: redirect.fromPath,
      toPath: redirect.toPath,
      statusCode: 301,
      reason: redirect.reason,
    })
  }

  void refreshSeoCaches().catch(() => undefined)
}
