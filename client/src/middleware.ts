import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { LOCALE_PATH_PREFIX, PWA_LOCALES, type PwaLocale } from '@/lib/locale'

export const LOCALE_HEADER = 'x-pwa-locale'

const PREFIX_TO_LOCALE = new Map(
  PWA_LOCALES.filter((l) => LOCALE_PATH_PREFIX[l]).map((l) => [LOCALE_PATH_PREFIX[l], l]),
)

function parseLocaleFromPath(pathname: string): { locale: PwaLocale; internalPath: string } {
  for (const [prefix, locale] of PREFIX_TO_LOCALE) {
    if (prefix && (pathname === prefix || pathname.startsWith(`${prefix}/`))) {
      const internalPath = pathname.slice(prefix.length) || '/'
      return { locale, internalPath }
    }
  }
  return { locale: 'IT', internalPath: pathname }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/llms.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/impersonate' ||
    pathname.startsWith('/impersonate/')
  ) {
    return NextResponse.next()
  }

  const { locale, internalPath } = parseLocaleFromPath(pathname)
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set(LOCALE_HEADER, locale)

  const url = request.nextUrl.clone()
  url.pathname = internalPath

  return NextResponse.rewrite(url, {
    request: { headers: requestHeaders },
  })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
}
