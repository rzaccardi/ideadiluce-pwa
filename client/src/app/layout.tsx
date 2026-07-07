import type { Metadata } from 'next'
import Script from 'next/script'
import { Providers } from '@/providers'
import { hanken } from '@/lib/fonts'
import { getSiteUrl, getGoogleSiteVerification } from '@/lib/env'
import { HTML_LANG } from '@/lib/locale'
import { getRequestLocale } from '@/lib/locale-server'
import { HOME_SEO_DESCRIPTION } from '@/lib/seo/home-metadata'
import {
  DEFAULT_OG_IMAGE_ALT,
  DEFAULT_OG_IMAGE_HEIGHT,
  DEFAULT_OG_IMAGE_PATH,
  DEFAULT_OG_IMAGE_WIDTH,
} from '@/lib/seo/og-image'
import { SW_CLEANUP_SCRIPT } from '@/lib/sw-cleanup-script'
import { THEME_INIT_SCRIPT } from '@/lib/theme-init-script'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: 'Idea di Luce',
    template: '%s | Idea di Luce',
  },
  description: HOME_SEO_DESCRIPTION,
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icons.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'it_IT',
    siteName: 'Idea di Luce',
    images: [
      {
        url: DEFAULT_OG_IMAGE_PATH,
        width: DEFAULT_OG_IMAGE_WIDTH,
        height: DEFAULT_OG_IMAGE_HEIGHT,
        alt: DEFAULT_OG_IMAGE_ALT,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [DEFAULT_OG_IMAGE_PATH],
  },
  robots: {
    index: true,
    follow: true,
  },
  ...(getGoogleSiteVerification()
    ? { verification: { google: getGoogleSiteVerification() } }
    : {}),
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getRequestLocale()
  const lang = HTML_LANG[locale]

  return (
    <html
      lang={lang}
      className={hanken.variable}
      suppressHydrationWarning
    >
      <body className="flex min-h-screen flex-col" suppressHydrationWarning>
        <Script id="idl-theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
        <Script id="legacy-sw-cleanup" strategy="beforeInteractive">
          {SW_CLEANUP_SCRIPT}
        </Script>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
