'use client'

import { ExternalLink } from '@/lib/link-title'
import { NavLink } from '@/lib/navigation'
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
    'flex w-full items-center gap-2.5 rounded-[9px] px-3.5 py-3 text-left text-sm font-semibold transition no-underline',
    isActive ? accountDcNavActiveClass : accountDcNavInactiveClass,
  )
}

export function AccountNav() {
  const { t } = useI18n()

  return (
    <nav aria-label={t('nav.account')} className={accountDcSidebarClass}>
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
      <div className="mx-1.5 my-2 h-px bg-[#ededea]" aria-hidden />
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
          'flex w-full items-center gap-2.5 rounded-[9px] px-3.5 py-3 text-sm font-semibold no-underline transition',
          accountDcNavInactiveClass,
        )}
      >
        {t('account.nav.support')}
      </ExternalLink>
    </nav>
  )
}
