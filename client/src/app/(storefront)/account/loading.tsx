'use client'

import { usePathname } from '@/lib/navigation'
import { resolveBootstrapRoute } from '@/app/bootstrapRoute'
import { AccountPageContentSkeleton } from '@/components/site/skeletons/BootstrapRouteSkeleton'

/** Skeleton solo del body: AccountLayout/shell restano montati. */
export default function AccountLoading() {
  const pathname = usePathname()
  const route = resolveBootstrapRoute(pathname)
  return <AccountPageContentSkeleton route={route} />
}
