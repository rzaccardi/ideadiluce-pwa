'use client'

import { useSnapshot } from 'valtio/react'
import { authStore } from '@/features/auth'
import { HeaderAccountMenu } from '@/components/site/HeaderAccountMenu'
import { HeaderMiniCart } from '@/components/site/HeaderMiniCart'
import { HeaderCatalogSearch } from '@/components/site/catalog/CatalogSearchModal'

export function SiteHeaderActions() {
  const auth = useSnapshot(authStore)

  return (
    <div className="flex min-w-0 shrink-0 items-center gap-1 sm:gap-1.5 lg:min-w-[72px] lg:justify-end lg:gap-1.5">
      <div className="lg:hidden">
        <HeaderCatalogSearch variant="icon" />
      </div>
      {auth.isAuthenticated ? (
        <HeaderAccountMenu />
      ) : (
        <div className="lg:hidden">
          <HeaderAccountMenu />
        </div>
      )}
      <HeaderMiniCart />
    </div>
  )
}

export function SiteHeaderSearch() {
  return (
    <div className="hidden min-w-0 lg:block lg:max-w-[240px] xl:max-w-[280px]">
      <HeaderCatalogSearch variant="bar" className="w-full" />
    </div>
  )
}
