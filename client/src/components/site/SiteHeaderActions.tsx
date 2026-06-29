'use client'

import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { HeaderThemeToggle } from '@/components/site/HeaderThemeToggle'
import { HeaderAccountMenu } from '@/components/site/HeaderAccountMenu'
import { HeaderMiniCart } from '@/components/site/HeaderMiniCart'
import { HeaderCatalogSearch } from '@/components/site/catalog/CatalogSearchModal'

export function SiteHeaderActions() {
  return (
    <div className="flex shrink-0 items-center gap-1 sm:gap-1.5 lg:gap-3">
      <HeaderCatalogSearch />
      <div className="hidden lg:block">
        <LanguageSwitcher variant="header" />
      </div>
      <div className="hidden lg:contents">
        <HeaderThemeToggle />
        <HeaderAccountMenu />
      </div>
      <HeaderMiniCart />
    </div>
  )
}
