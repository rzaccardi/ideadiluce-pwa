import { getServerApiUrl } from '@/lib/env'

/** Allineato allo scheduler SEO (1 ora). */
export const SEO_ASSET_REVALIDATE_SECONDS = 60 * 60

export const SEO_ASSET_CACHE_CONTROL =
  'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400'

/** Path pubblici storefront → path versionati sul BFF (evita root `/sitemap.xml` mal instradato). */
const SEO_UPSTREAM_BY_PUBLIC_PATH: Record<string, string> = {
  '/sitemap.xml': '/api/v1/seo/sitemap.xml',
  '/llms.txt': '/api/v1/seo/llms.txt',
  '/merchant-feed.xml': '/api/v1/seo/merchant-feed.xml',
}

function looksLikeHtml(body: string): boolean {
  return /^\s*</.test(body) && /^\s*<(!doctype|html)\b/i.test(body)
}

function isPlausibleSeoBody(path: string, body: string): boolean {
  if (!body.trim() || looksLikeHtml(body)) return false
  if (path.endsWith('.xml')) {
    return body.includes('<urlset') || body.includes('<rss') || body.includes('<feed')
  }
  return true
}

export async function proxySeoAsset(
  path: string,
  contentType: string,
): Promise<Response> {
  const apiBase = getServerApiUrl().replace(/\/$/, '')
  const upstreamPath = SEO_UPSTREAM_BY_PUBLIC_PATH[path] ?? `/api/v1/seo${path}`
  let upstream: Response
  try {
    upstream = await fetch(`${apiBase}${upstreamPath}`, {
      cache: 'no-store',
    })
  } catch {
    return new Response('Servizio SEO temporaneamente non disponibile', { status: 502 })
  }

  if (!upstream.ok) {
    return new Response('Servizio SEO temporaneamente non disponibile', { status: 502 })
  }

  const body = await upstream.text()
  if (!isPlausibleSeoBody(path, body)) {
    return new Response('Servizio SEO temporaneamente non disponibile', { status: 502 })
  }

  const headers = new Headers({
    'Content-Type': contentType,
    'Cache-Control': SEO_ASSET_CACHE_CONTROL,
  })
  const lastModified = upstream.headers.get('last-modified')
  if (lastModified) headers.set('Last-Modified', lastModified)

  return new Response(body, { status: 200, headers })
}
