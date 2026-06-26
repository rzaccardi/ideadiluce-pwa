'use client'

import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { HeaderThemeToggle } from '@/components/site/HeaderThemeToggle'
import { HeaderAccountMenu } from '@/components/site/HeaderAccountMenu'
import { HeaderMiniCart } from '@/components/site/HeaderMiniCart'

export function SiteHeaderActions() {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <LanguageSwitcher variant="header" />
      <HeaderThemeToggle />
      <HeaderAccountMenu />
      <HeaderMiniCart />
    </div>
  )
}
