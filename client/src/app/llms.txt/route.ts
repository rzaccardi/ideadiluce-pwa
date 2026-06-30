import { proxySeoAsset } from '@/lib/seo-public-routes'

/** 6 ore — allineato allo scheduler SEO lato API. */
export const revalidate = 21600

export async function GET() {
  return proxySeoAsset('/llms.txt', 'text/plain; charset=utf-8')
}
