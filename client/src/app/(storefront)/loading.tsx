'use client'

import { usePathname } from '@/lib/navigation'
import { BootstrapRouteSkeleton } from '@/components/site/skeletons/BootstrapRouteSkeleton'

/**
 * Instant loading UI per tutta la storefront: al click mostra subito lo skeleton
 * della destinazione (invece di restare sulla pagina corrente fino al RSC).
 */
export default function StorefrontLoading() {
  const pathname = usePathname()
  return <BootstrapRouteSkeleton pathname={pathname} />
}
