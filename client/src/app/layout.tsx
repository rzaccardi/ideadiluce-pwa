import type { Metadata } from 'next'
import Script from 'next/script'
import { Providers } from '@/providers'
import { hanken } from '@/lib/fonts'
import './globals.css'

export const metadata: Metadata = {
  title: 'Idea di Luce',
  description: 'Illuminazione per casa e professionisti',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icons.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="it"
      className={hanken.variable}
      suppressHydrationWarning
    >
      <body className="flex min-h-screen flex-col" suppressHydrationWarning>
        <Script id="idl-theme-init" strategy="beforeInteractive">
          {`(function(){try{var t=localStorage.getItem('idl-theme');if(t==='dark'){document.documentElement.dataset.theme='dark';document.documentElement.style.colorScheme='dark'}}catch(e){}})();`}
        </Script>
        <Script id="legacy-sw-cleanup" strategy="beforeInteractive">
          {`(function(){if(!('serviceWorker'in navigator))return;var k='idl-sw-clean';if(sessionStorage.getItem(k))return;navigator.serviceWorker.getRegistrations().then(function(r){if(!r.length)return;return Promise.all(r.map(function(x){return x.unregister()}))}).then(function(changed){if(!window.caches)return changed;return caches.keys().then(function(keys){return Promise.all(keys.map(function(key){return caches.delete(key)}))}).then(function(){return changed})}).then(function(changed){if(changed){sessionStorage.setItem(k,'1');location.reload()}})})();`}
        </Script>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
