import type { Metadata } from 'next'
import Script from 'next/script'
import { Providers } from '@/providers'
import { hanken } from '@/lib/fonts'
import { getSiteUrl } from '@/lib/env'
import { HTML_LANG } from '@/lib/locale'
import { getRequestLocale } from '@/lib/locale-server'
import { SW_CLEANUP_SCRIPT } from '@/lib/sw-cleanup-script'
import { THEME_INIT_SCRIPT } from '@/lib/theme-init-script'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: 'Idea di Luce',
    template: '%s | Idea di Luce',
  },
  description: 'La luce pensata. Illuminazione per casa e professionisti.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icons.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'it_IT',
    siteName: 'Idea di Luce',
  },
  robots: {
    index: true,
    follow: true,
  },
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
