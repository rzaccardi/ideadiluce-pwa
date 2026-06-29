import type { Metadata } from 'next'
import Script from 'next/script'
import { Providers } from '@/providers'
import { hanken } from '@/lib/fonts'
import { getSiteUrl } from '@/lib/env'
import { HTML_LANG } from '@/lib/locale'
import { getRequestLocale } from '@/lib/locale-server'
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
          {`(function(){try{var t=localStorage.getItem('idl-theme');if(t==='light'||t==='dark'){document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t==='dark'?'dark':'light'}else{delete document.documentElement.dataset.theme;document.documentElement.style.colorScheme='light'}}catch(e){}})();`}
        </Script>
        <Script id="legacy-sw-cleanup" strategy="beforeInteractive">
          {`(function(){if(!('serviceWorker'in navigator))return;var k='idl-sw-clean';if(sessionStorage.getItem(k))return;navigator.serviceWorker.getRegistrations().then(function(r){if(!r.length)return;return Promise.all(r.map(function(x){return x.unregister()}))}).then(function(changed){if(!window.caches)return changed;return caches.keys().then(function(keys){return Promise.all(keys.map(function(key){return caches.delete(key)}))}).then(function(){return changed})}).then(function(changed){if(changed){sessionStorage.setItem(k,'1');location.reload()}})})();`}
        </Script>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
