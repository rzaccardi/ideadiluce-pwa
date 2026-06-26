import type { MessageKey } from '@/i18n/messages'

export type AccountNavItem = {
  to: string
  labelKey: MessageKey
  end?: boolean
}

export const ACCOUNT_PRIMARY_NAV: AccountNavItem[] = [
  { to: '/account', labelKey: 'account.nav.dashboard', end: true },
  { to: '/account/orders', labelKey: 'account.nav.orders' },
  { to: '/account/wishlist', labelKey: 'account.nav.parts' },
  { to: '/account/addresses', labelKey: 'account.nav.addresses' },
  { to: '/account/payments', labelKey: 'account.nav.payments' },
  { to: '/account/profile', labelKey: 'account.nav.data' },
]

export const ACCOUNT_SECONDARY_NAV: AccountNavItem[] = [
  { to: '/account/quotes', labelKey: 'account.nav.quotes' },
  { to: '/account/invoices', labelKey: 'account.nav.invoices' },
]
