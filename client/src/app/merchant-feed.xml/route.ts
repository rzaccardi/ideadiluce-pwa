import { proxySeoAsset } from '@/lib/seo-public-routes'

/** 6 ore — allineato allo scheduler SEO lato API. */
export const revalidate = 21600

export async function GET() {
  return proxySeoAsset('/merchant-feed.xml', 'application/xml; charset=utf-8')
}
