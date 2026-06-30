import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/lib/env'

export default function robots(): MetadataRoute.Robots {
  const site = getSiteUrl().replace(/\/$/, '')

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/llms.txt'],
        disallow: [
          '/account/',
          '/checkout/',
          '/carrello/',
          '/cart/',
          '/wishlist/',
          '/login/',
          '/register/',
          '/forgot-password/',
          '/reset-password/',
          '/admin/',
          '/api/',
          '/impersonate/',
        ],
      },
    ],
    sitemap: `${site}/sitemap.xml`,
    host: site,
  }
}
