import type { Response } from 'express'

/** Cache pubblica allineata allo scheduler SEO (rigenerazione ogni 6 ore). */
export const SEO_PUBLIC_CACHE_CONTROL =
  'public, max-age=300, s-maxage=21600, stale-while-revalidate=86400'

export function sendSeoPublicAsset(res: Response, contentType: string, body: string, builtAt?: string) {
  res.set('Cache-Control', SEO_PUBLIC_CACHE_CONTROL)
  if (builtAt) {
    res.set('Last-Modified', new Date(builtAt).toUTCString())
  }
  res.type(contentType).send(body)
}
