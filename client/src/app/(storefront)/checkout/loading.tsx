'use client'

import { usePathname } from '@/lib/navigation'
import { BootstrapRouteSkeleton } from '@/components/site/skeletons/BootstrapRouteSkeleton'

export default function CheckoutLoading() {
  const pathname = usePathname()
  return <BootstrapRouteSkeleton pathname={pathname} />
}
