import type { Metadata } from 'next'
import { getRequestLocale } from '@/lib/locale-server'
import { fetchHomeContentServer } from '@/lib/server-site'
import { fetchHomeBrandsServer, fetchHomeProductSlidersServer, fetchFeaturedGuidesServer } from '@/lib/server-catalog'
import { HomePage2 } from '@/views/HomePage2'

export const metadata: Metadata = {
  title: 'Homepage design — anteprima',
  description: 'Anteprima homepage visual dedicata all\'illuminazione d\'arredo.',
  robots: { index: false, follow: false },
}

export default async function Page() {
  const locale = await getRequestLocale()
  const [initialContent, initialProductSliders, initialBrands, initialFeaturedGuides] = await Promise.all([
    fetchHomeContentServer(locale),
    fetchHomeProductSlidersServer(locale),
    fetchHomeBrandsServer(locale),
    fetchFeaturedGuidesServer(locale),
  ])

  return (
    <HomePage2
      initialContent={initialContent}
      initialProductSliders={initialProductSliders}
      initialBrands={initialBrands}
      initialFeaturedGuides={initialFeaturedGuides}
    />
  )
}
