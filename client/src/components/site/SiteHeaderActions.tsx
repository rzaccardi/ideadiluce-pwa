'use client'

import { useSnapshot } from 'valtio/react'
import { authStore } from '@/features/auth'
import { HeaderAccountMenu } from '@/components/site/HeaderAccountMenu'
import { HeaderMiniCart } from '@/components/site/HeaderMiniCart'
import { HeaderCatalogSearch } from '@/components/site/catalog/CatalogSearchModal'
import { ui } from '@/lib/ui-classes'
import { cn } from '@/utils/cn'

export function SiteHeaderActions() {
  const auth = useSnapshot(authStore)

  return (
    <div className={cn(ui.headerIconRow, 'min-w-0 lg:justify-end')}>
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

export function SiteHeaderSearch({ compact = false }: { compact?: boolean }) {
  return (
    <>
      <div className={cn('hidden shrink-0 lg:block', !compact && '2xl:hidden')}>
        <HeaderCatalogSearch variant="icon" />
      </div>
      {!compact ? (
        <div className="hidden min-w-0 shrink-0 2xl:block 2xl:w-[280px]">
          <HeaderCatalogSearch variant="bar" className="w-full" />
        </div>
      ) : null}
    </>
  )
}
