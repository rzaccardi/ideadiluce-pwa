import { getServerApiUrl } from '@/lib/env'

/** Allineato allo scheduler SEO (6 ore). */
export const SEO_ASSET_REVALIDATE_SECONDS = 6 * 60 * 60

export const SEO_ASSET_CACHE_CONTROL =
  'public, max-age=300, s-maxage=21600, stale-while-revalidate=86400'

export async function proxySeoAsset(
  path: string,
  contentType: string,
): Promise<Response> {
  const apiBase = getServerApiUrl().replace(/\/$/, '')
  let upstream: Response
  try {
    upstream = await fetch(`${apiBase}${path}`, {
      cache: 'no-store',
    })
  } catch {
    return new Response('Servizio SEO temporaneamente non disponibile', { status: 502 })
  }

  if (!upstream.ok) {
    return new Response('Servizio SEO temporaneamente non disponibile', { status: 502 })
  }

  const body = await upstream.text()
  const headers = new Headers({
    'Content-Type': contentType,
    'Cache-Control': SEO_ASSET_CACHE_CONTROL,
  })
  const lastModified = upstream.headers.get('last-modified')
  if (lastModified) headers.set('Last-Modified', lastModified)

  return new Response(body, { status: 200, headers })
}
