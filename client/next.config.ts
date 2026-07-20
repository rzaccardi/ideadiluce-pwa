import path from 'node:path'
import { config as loadDotenv } from 'dotenv'
import type { NextConfig } from 'next'
import { SEO_CANONICAL_ALIAS_REDIRECTS } from './src/lib/legacy-seo-pages.config'

const SHOWROOM_MAPS_URL = 'https://share.google/k0SAIICa1mlkcPpBf'

const repoRoot = path.resolve(__dirname, '..')
loadDotenv({ path: path.join(repoRoot, '.env') })

const apiUrl =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  'http://localhost:4100'

const LOCALE_PREFIXES = ['', '/en', '/es', '/fr', '/de']

function withTrailingSlashVariants(
  rules: Array<{ source: string; destination: string; permanent: boolean }>,
  source: string,
  destination: string,
) {
  rules.push({ source, destination, permanent: true })
  if (!source.endsWith('/')) {
    rules.push({ source: `${source}/`, destination, permanent: true })
  }
}

function buildSeoRedirects() {
  const rules: Array<{ source: string; destination: string; permanent: boolean }> = []
  const legacyPosts = [
    { source: '/2024/06/26/luce-calda-o-fredda', destination: '/guide/luce-calda-o-fredda' },
    { source: '/2024/06/04/calipso-artemide-io-vengo-dalla-luna', destination: '/guide/calipso-artemide-io-vengo-dalla-luna' },
    { source: '/2024/06/25/la-natura-trend-2024', destination: '/guide/la-natura-trend-2024' },
  ]
  for (const prefix of LOCALE_PREFIXES) {
    rules.push(
      { source: `${prefix}/product/:slug`, destination: `${prefix}/prodotto/:slug`, permanent: true },
      { source: `${prefix}/category/:slug`, destination: `${prefix}/categoria/:slug`, permanent: true },
    )
    for (const post of legacyPosts) {
      withTrailingSlashVariants(rules, `${prefix}${post.source}`, `${prefix}${post.destination}`)
    }
    for (const alias of SEO_CANONICAL_ALIAS_REDIRECTS) {
      withTrailingSlashVariants(rules, `${prefix}${alias.fromPath}`, `${prefix}${alias.toPath}`)
    }
    withTrailingSlashVariants(rules, `${prefix}/showroom`, SHOWROOM_MAPS_URL)
  }
  return rules
}

const nextConfig: NextConfig = {
  reactStrictMode: false,
  // zod esterno evita vendor-chunks stale in dev/HMR; motion va bundlato (useContext SSR).
  serverExternalPackages: ['zod'],
  experimental: {
    optimizePackageImports: ['motion', 'framer-motion'],
    // Dev proxy: add-to-cart può superare 30s (OdooCatalog + Odoo).
    proxyTimeout: 120_000,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
    remotePatterns: [
      { protocol: 'https', hostname: 'tlbdb.odoo.com', pathname: '/web/image/**' },
      { protocol: 'https', hostname: '**.odoo.com', pathname: '/web/image/**' },
      { protocol: 'https', hostname: 'ideadiluce.com', pathname: '/wp-content/uploads/**' },
    ],
  },
  async redirects() {
    return buildSeoRedirects()
  },
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${apiUrl.replace(/\/$/, '')}/api/:path*` }]
  },
}

export default nextConfig
