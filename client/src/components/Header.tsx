'use client'

import { Link, NavLink } from '@/lib/navigation'
import { useSnapshot } from 'valtio/react'
import { authStore } from '@/features/auth'
import { cartStore } from '@/features/cart'
import { useLogoutConfirm } from '@/hooks/use-logout-confirm'
import { cn } from '@/utils/cn'
import { Container } from '@/components/Container'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useLocale } from '@/context/locale-context'
import { useI18n } from '@/hooks/use-i18n'

const navClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'text-sm font-medium transition',
    isActive ? 'text-zinc-900' : 'text-zinc-500 hover:text-zinc-800',
  )

export function Header() {
  const { localize } = useLocale()
  const { t } = useI18n()
  const auth = useSnapshot(authStore)
  const cart = useSnapshot(cartStore)
  const { requestLogout, logoutDialog } = useLogoutConfirm()

  return (
    <header className="border-b border-zinc-200 bg-white">
      <Container className="flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
        <Link to={localize('/')} className="text-lg font-semibold tracking-tight text-zinc-900">
          {t('brand.name')}
        </Link>
        <nav className="flex flex-wrap items-center gap-4 md:justify-center">
          <NavLink to={localize('/catalogo')} className={navClass}>
            {t('nav.catalog')}
          </NavLink>
          <NavLink to={localize('/wishlist')} className={navClass}>
            {t('nav.wishlist')}
          </NavLink>
          <NavLink to={localize('/cart')} className={navClass}>
            {t('nav.cart')}
            {cart.cart && cart.cart.itemCount > 0 ? (
              <span className="ml-1 rounded-full bg-zinc-900 px-2 py-0.5 text-xs text-white">
                {cart.cart.itemCount}
              </span>
            ) : null}
          </NavLink>
          <NavLink to={localize('/checkout')} className={navClass}>
            {t('nav.checkout')}
          </NavLink>
        </nav>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          {auth.isAuthenticated ? (
            <>
              <NavLink to={localize('/account')} className={navClass}>
                {t('nav.account')}
              </NavLink>
              <button
                type="button"
                onClick={requestLogout}
                className="text-sm text-zinc-500 hover:text-zinc-800"
              >
                {t('nav.logout')}
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={navClass}>
                {t('nav.login')}
              </NavLink>
              <Link
                to="/register"
                className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800"
              >
                {t('nav.register')}
              </Link>
            </>
          )}
        </div>
      </Container>
      {logoutDialog}
    </header>
  )
}
