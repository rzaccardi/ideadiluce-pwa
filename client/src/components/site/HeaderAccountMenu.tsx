'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Link } from '@/lib/navigation'
import { useSnapshot } from 'valtio/react'
import { authStore } from '@/features/auth'
import { accountDisplayName } from '@/components/account/accountHeaderCopy'
import { useLogoutConfirm } from '@/hooks/use-logout-confirm'
import { useI18n } from '@/hooks/use-i18n'
import { useLocalePath } from '@/hooks/use-locale-path'
import {
  ACCOUNT_PRIMARY_NAV,
  ACCOUNT_SECONDARY_NAV,
} from '@/lib/account-nav-items'
import type { UserDTO } from '@/types/dto'
import { cn } from '@/utils/cn'
import { ui } from '@/lib/ui-classes'

function UserIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none">
      <circle cx="12" cy="8" r="3.6" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 20a7 7 0 0 1 14 0" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  )
}

function userInitial(user: UserDTO): string {
  const fromName = [user.firstName, user.lastName]
    .filter(Boolean)
    .map((part) => part!.trim()[0])
    .join('')
  if (fromName) return fromName.slice(0, 2).toUpperCase()
  return user.email.trim()[0]?.toUpperCase() ?? '?'
}

type Props = {
  variant?: 'header' | 'mobileNav'
  onOpenChange?: (open: boolean) => void
  /** Chiamato dopo navigazione (es. chiudere il menu mobile). */
  onNavigate?: () => void
}

export function HeaderAccountMenu({ variant = 'header', onOpenChange, onNavigate }: Props) {
  const lp = useLocalePath()
  const { t } = useI18n()
  const auth = useSnapshot(authStore)
  const { requestLogout, logoutDialog } = useLogoutConfirm()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  const setMenuOpen = (value: boolean) => {
    setOpen(value)
    onOpenChange?.(value)
  }

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return
      setMenuOpen(false)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  if (!auth.isAuthenticated || !auth.me) {
    if (variant === 'mobileNav') {
      return (
        <Link
          to={lp('/login')}
          aria-label={t('nav.login')}
          title={t('nav.login')}
          onClick={onNavigate}
          className={cn(
            ui.interactive,
            'flex w-full items-center gap-3 rounded-md py-1 no-underline',
            ui.headerNavLink,
          )}
        >
          <UserIcon className="size-[22px] shrink-0" />
          <span>{t('nav.login')}</span>
        </Link>
      )
    }

    return (
      <Link
        to={lp('/login')}
        aria-label={t('nav.login')}
        title={t('nav.login')}
        className={cn(ui.interactive, ui.headerAction, ui.headerActionBtn, 'no-underline')}
      >
        <UserIcon className="size-[17px] shrink-0" />
        <span className={ui.headerActionText}>{t('nav.login')}</span>
      </Link>
    )
  }

  const user = auth.me
  const displayName = accountDisplayName(user)

  if (variant === 'mobileNav') {
    return (
      <>
        <div ref={rootRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(!open)}
            aria-expanded={open}
            aria-haspopup="menu"
            aria-controls={menuId}
            aria-label={t('nav.account')}
            className={cn(
              ui.interactive,
              'flex w-full items-center gap-3 rounded-md py-1 text-left',
              ui.headerNavLink,
            )}
          >
            <span
              className="flex size-[22px] shrink-0 items-center justify-center rounded-full border border-idl-border-strong bg-idl-design font-serif text-[11px] font-semibold text-idl-glow"
              aria-hidden
            >
              {userInitial(user)}
            </span>
            <span className="min-w-0 flex-1 truncate">{displayName}</span>
            <span className="text-[10px] opacity-60" aria-hidden>
              {open ? '▴' : '▾'}
            </span>
          </button>

          {open ? (
            <div id={menuId} role="menu" className="mt-2 flex flex-col gap-1 pl-1">
              {ACCOUNT_PRIMARY_NAV.map((item) => (
                <Link
                  key={item.to}
                  to={lp(item.to)}
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false)
                    onNavigate?.()
                  }}
                  className={cn('block rounded-md px-1 py-2 text-[15px] font-medium', ui.headerNavLink)}
                >
                  {t(item.labelKey)}
                </Link>
              ))}

              {ACCOUNT_SECONDARY_NAV.map((item) => (
                <Link
                  key={item.to}
                  to={lp(item.to)}
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false)
                    onNavigate?.()
                  }}
                  className={cn('block rounded-md px-1 py-2 text-[15px] font-medium', ui.headerNavLink)}
                >
                  {t(item.labelKey)}
                </Link>
              ))}

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false)
                  requestLogout()
                }}
                className={cn(
                  ui.navButton,
                  'rounded-md px-1 py-2 text-left text-[15px] font-bold text-idl-brass',
                )}
              >
                {t('nav.logout')}
              </button>
            </div>
          ) : null}
        </div>
        {logoutDialog}
      </>
    )
  }

  return (
    <>
      <div ref={rootRef} className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen(!open)}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-controls={menuId}
          title={t('nav.account')}
          className={cn(
            ui.interactive,
            'inline-flex size-[38px] shrink-0 items-center justify-center rounded-full border-2 border-idl-border-strong bg-idl-design p-0 font-serif text-[17px] font-semibold text-idl-glow hover:border-idl-brass',
          )}
        >
          {userInitial(user)}
        </button>

        {open ? (
          <div id={menuId} role="menu" className={cn(ui.headerDropdown, 'w-[248px]')}>
            <div className="mb-1.5 flex items-center gap-2.5 border-b border-idl-tech-border px-2.5 py-2.5">
              <span
                className="flex size-[38px] shrink-0 items-center justify-center rounded-full border border-idl-border-strong bg-idl-design font-serif text-[17px] font-semibold text-idl-glow"
                aria-hidden
              >
                {userInitial(user)}
              </span>
              <div className="min-w-0">
                <div className="truncate text-sm font-extrabold text-idl-ink">{displayName}</div>
                <div className="truncate text-[11.5px] text-idl-placeholder">{user.email}</div>
              </div>
            </div>

            {ACCOUNT_PRIMARY_NAV.map((item) => (
              <Link
                key={item.to}
                to={lp(item.to)}
                role="menuitem"
                onClick={() => setMenuOpen(false)}
                className={ui.headerDropdownItem}
              >
                {t(item.labelKey)}
              </Link>
            ))}

            <div className={ui.headerDropdownDivider} aria-hidden />

            {ACCOUNT_SECONDARY_NAV.map((item) => (
              <Link
                key={item.to}
                to={lp(item.to)}
                role="menuitem"
                onClick={() => setMenuOpen(false)}
                className={ui.headerDropdownItem}
              >
                {t(item.labelKey)}
              </Link>
            ))}

            <div className={ui.headerDropdownDivider} aria-hidden />

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false)
                requestLogout()
              }}
              className={cn(
                ui.navButton,
                ui.headerDropdownItem,
                'text-left font-bold text-idl-brass hover:text-idl-brass',
              )}
            >
              {t('nav.logout')}
            </button>
          </div>
        ) : null}
      </div>
      {logoutDialog}
    </>
  )
}
