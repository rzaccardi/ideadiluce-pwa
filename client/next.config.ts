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

const nextConfig: NextConfig = {
  reactStrictMode: false,
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
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${apiUrl.replace(/\/$/, '')}/api/:path*` },
      { source: '/sitemap.xml', destination: `${apiUrl.replace(/\/$/, '')}/sitemap.xml` },
    ]
  },
}

export default nextConfig
