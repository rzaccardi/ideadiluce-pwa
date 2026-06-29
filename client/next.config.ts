import path from 'node:path'
import { config as loadDotenv } from 'dotenv'
import type { NextConfig } from 'next'

const repoRoot = path.resolve(__dirname, '..')
loadDotenv({ path: path.join(repoRoot, '.env') })

const apiUrl =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  'http://localhost:4000'

const LOCALE_PREFIXES = ['', '/en', '/es', '/fr', '/de']

function buildSeoRedirects() {
  const rules: Array<{ source: string; destination: string; permanent: boolean }> = []
  for (const prefix of LOCALE_PREFIXES) {
    rules.push(
      { source: `${prefix}/product/:slug`, destination: `${prefix}/prodotto/:slug`, permanent: true },
      { source: `${prefix}/category/:slug`, destination: `${prefix}/categoria/:slug`, permanent: true },
      { source: `${prefix}/catalog`, destination: `${prefix}/catalogo`, permanent: true },
    )
  }
  return rules
}

const nextConfig: NextConfig = {
  reactStrictMode: false,
  // zod esterno evita vendor-chunks stale in dev/HMR; motion va bundlato (useContext SSR).
  serverExternalPackages: ['zod'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'tlbdb.odoo.com', pathname: '/web/image/**' },
      { protocol: 'https', hostname: '**.odoo.com', pathname: '/web/image/**' },
    ],
  },
  async redirects() {
    return buildSeoRedirects()
  },
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${apiUrl.replace(/\/$/, '')}/api/:path*` },
      { source: '/sitemap.xml', destination: `${apiUrl.replace(/\/$/, '')}/sitemap.xml` },
      { source: '/llms.txt', destination: `${apiUrl.replace(/\/$/, '')}/llms.txt` },
      { source: '/merchant-feed.xml', destination: `${apiUrl.replace(/\/$/, '')}/merchant-feed.xml` },
    ]
  },
}

export default nextConfig
