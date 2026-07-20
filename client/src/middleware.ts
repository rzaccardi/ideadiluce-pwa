import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { LOCALE_PATH_PREFIX, PWA_LOCALES, type PwaLocale } from '@/lib/locale'

export const LOCALE_HEADER = 'x-pwa-locale'

const PREFIX_TO_LOCALE = new Map(
  PWA_LOCALES.filter((l) => LOCALE_PATH_PREFIX[l]).map((l) => [LOCALE_PATH_PREFIX[l], l]),
)

const SEO_REDIRECT_API =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  'http://localhost:4100'

function parseLocaleFromPath(pathname: string): { locale: PwaLocale; internalPath: string } {
  for (const [prefix, locale] of PREFIX_TO_LOCALE) {
    if (prefix && (pathname === prefix || pathname.startsWith(`${prefix}/`))) {
      const internalPath = pathname.slice(prefix.length) || '/'
      return { locale, internalPath }
    }
  }
  return { locale: 'IT', internalPath: pathname }
}

const SEO_REDIRECT_SKIP_EXACT = new Set([
  '/',
  '/negozio',
  '/catalog',
  '/catalogo',
  '/cart',
  '/checkout',
  '/login',
  '/register',
  '/wishlist',
  '/account',
  '/professionisti',
  '/brand',
  '/ambienti',
  '/acquista-ambiente',
  '/attacco',
  '/guide',
  '/blog',
  '/chi-siamo',
  '/contatti',
  '/spedizioni',
  '/pagamenti',
  '/garanzia',
  '/privacy-policy',
  '/privacy',
  '/tos',
  '/on-demand',
  '/lavora-con-noi',
  '/prodotto-non-trovato',
  '/forgot-password',
  '/reset-password',
  '/illuminazione-arredo',
  '/homepage2',
  '/impersonate',
])

const SEO_REDIRECT_SKIP_PREFIXES = [
  '/prodotto/',
  '/product/',
  '/categoria/',
  '/category/',
  '/categoria-prodotto/',
  '/categoria-tecnica/',
  '/checkout/',
  '/account/',
  '/brand/',
  '/ambienti/',
  '/attacco/',
  '/tipologia/',
  '/stile/',
  '/tag/',
  '/guide/',
  '/impersonate/',
]

/** Lookup SEO solo per path legacy o non mappati alle route attive. */
function shouldLookupSeoRedirect(internalPath: string): boolean {
  const normalized = internalPath.length > 1 && internalPath.endsWith('/')
    ? internalPath.slice(0, -1)
    : internalPath

  if (SEO_REDIRECT_SKIP_EXACT.has(normalized)) return false
  if (SEO_REDIRECT_SKIP_PREFIXES.some((prefix) => normalized.startsWith(prefix))) return false

  // Post WordPress datati: redirect gestiti anche in next.config, ma lookup resta utile se DB ha override.
  if (/^\/\d{4}\/\d{2}\/\d{2}(\/|$)/.test(normalized)) return true

  // Slug singolo non in whitelist: possibile redirect admin (es. vecchi permalink).
  if (/^\/[^/]+$/.test(normalized)) return true

  return false
}

async function lookupSeoRedirect(internalPath: string): Promise<{ toPath: string; statusCode: number } | null> {
  try {
    const url = `${SEO_REDIRECT_API.replace(/\/$/, '')}/api/v1/seo/redirect?path=${encodeURIComponent(internalPath)}`
    const res = await fetch(url, { next: { revalidate: 300 } })
    if (!res.ok) return null
    const json = (await res.json()) as { data?: { toPath: string; statusCode: number } | null }
    return json.data ?? null
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/llms.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/merchant-feed.xml' ||
    pathname === '/impersonate' ||
    pathname.startsWith('/impersonate/')
  ) {
    return NextResponse.next()
  }

  const { locale, internalPath } = parseLocaleFromPath(pathname)
  const redirect = shouldLookupSeoRedirect(internalPath)
    ? await lookupSeoRedirect(internalPath)
    : null
  if (redirect) {
    if (/^https?:\/\//i.test(redirect.toPath)) {
      return NextResponse.redirect(redirect.toPath, redirect.statusCode === 302 ? 302 : 301)
    }
    const prefix = LOCALE_PATH_PREFIX[locale]
    const destination = `${prefix}${redirect.toPath.startsWith('/') ? redirect.toPath : `/${redirect.toPath}`}`
    const target = request.nextUrl.clone()
    target.pathname = destination
    return NextResponse.redirect(target, redirect.statusCode === 302 ? 302 : 301)
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set(LOCALE_HEADER, locale)

  const url = request.nextUrl.clone()
  url.pathname = internalPath

  return NextResponse.rewrite(url, {
    request: { headers: requestHeaders },
  })
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|merchant-feed.xml|llms.txt).*)',
  ],
}
