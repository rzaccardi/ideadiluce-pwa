'use client'

import { useEffect, useRef } from 'react'
import { ExternalLink } from '@/lib/link-title'
import { NavLink, usePathname } from '@/lib/navigation'
import { useI18n } from '@/hooks/use-i18n'
import { ACCOUNT_PRIMARY_NAV, ACCOUNT_SECONDARY_NAV } from '@/lib/account-nav-items'
import { cn } from '@/utils/cn'
import {
  accountDcNavActiveClass,
  accountDcNavInactiveClass,
  accountDcSidebarClass,
} from './dc/account-dc-styles'

function navLinkClass(isActive: boolean) {
  return cn(
    'flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-[9px] px-3.5 py-2.5 text-sm font-semibold transition no-underline lg:w-full lg:py-3 lg:text-left',
    isActive ? accountDcNavActiveClass : accountDcNavInactiveClass,
  )
}

export function AccountNav() {
  const { t } = useI18n()
  const pathname = usePathname()
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const active = navRef.current?.querySelector<HTMLElement>('[aria-current="page"]')
    active?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }, [pathname])

  return (
    <nav aria-label={t('nav.account')} ref={navRef} className={accountDcSidebarClass}>
      {ACCOUNT_PRIMARY_NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => navLinkClass(isActive)}
        >
          {t(item.labelKey)}
        </NavLink>
      ))}
      <div className="mx-1.5 my-2 hidden h-px bg-[#ededea] lg:block" aria-hidden />
      {ACCOUNT_SECONDARY_NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => navLinkClass(isActive)}
        >
          {t(item.labelKey)}
        </NavLink>
      ))}
      <ExternalLink
        href="/contatti"
        className={cn(
          'flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-[9px] px-3.5 py-2.5 text-sm font-semibold no-underline transition lg:w-full lg:py-3',
          accountDcNavInactiveClass,
        )}
      >
        {t('account.nav.support')}
      </ExternalLink>
    </nav>
  )
}
