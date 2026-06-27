'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Link } from '@/lib/navigation'
import { useSnapshot } from 'valtio/react'
import { authStore } from '@/features/auth'
import { accountDisplayName } from '@/components/account/accountHeaderCopy'
import { useLogoutConfirm } from '@/hooks/use-logout-confirm'
import { useI18n } from '@/hooks/use-i18n'
import { useLocalePath } from '@/hooks/use-locale-path'
import { useTheme } from '@/context/theme-context'
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
  onOpenChange?: (open: boolean) => void
}

export function HeaderAccountMenu({ onOpenChange }: Props) {
  const lp = useLocalePath()
  const { t } = useI18n()
  const { isDark } = useTheme()
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
    return (
      <Link
        to={lp('/login')}
        aria-label={t('nav.login')}
        title={t('nav.login')}
        className={cn(
          ui.interactive,
          ui.headerAction,
          'no-underline',
          isDark
            ? 'border-white/16 bg-white/6 text-idl-design-fg hover:border-idl-brass hover:text-idl-glow'
            : 'border-idl-border-strong bg-white text-idl-ink-soft hover:text-idl-ink',
        )}
      >
        <UserIcon className="size-[17px] shrink-0" />
        <span className={ui.headerActionText}>{t('nav.login')}</span>
      </Link>
    )
  }

  const user = auth.me
  const displayName = accountDisplayName(user)

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
            'inline-flex size-[38px] shrink-0 items-center justify-center rounded-full border-2 bg-idl-design p-0 font-serif text-[17px] font-semibold text-idl-glow hover:border-idl-brass',
            isDark ? 'border-idl-glow/50' : 'border-[#e0d2bd]',
          )}
        >
          {userInitial(user)}
        </button>

        {open ? (
          <div
            id={menuId}
            role="menu"
            className={cn(
              'absolute right-0 top-full z-50 mt-2 w-[248px] rounded-[14px] border p-2 shadow-[0_20px_54px_rgba(0,0,0,0.2)]',
              isDark ? 'border-white/12 bg-idl-design-elevated' : 'border-idl-border bg-white',
            )}
          >
            <div
              className={cn(
                'mb-1.5 flex items-center gap-2.5 border-b px-2.5 py-2.5',
                isDark ? 'border-white/10' : 'border-idl-tech-border',
              )}
            >
              <span
                className={cn(
                  'flex size-[38px] shrink-0 items-center justify-center rounded-full bg-idl-design font-serif text-[17px] font-semibold text-idl-glow',
                  isDark ? 'border border-idl-glow/50' : 'border border-[#e0d2bd]',
                )}
                aria-hidden
              >
                {userInitial(user)}
              </span>
              <div className="min-w-0">
                <div
                  className={cn(
                    'truncate text-sm font-extrabold',
                    isDark ? 'text-idl-design-fg' : 'text-idl-ink',
                  )}
                >
                  {displayName}
                </div>
                <div className={cn('truncate text-[11.5px]', isDark ? 'text-idl-design-subtle' : 'text-idl-placeholder')}>
                  {user.email}
                </div>
              </div>
            </div>

            {ACCOUNT_PRIMARY_NAV.map((item) => (
              <Link
                key={item.to}
                to={lp(item.to)}
                role="menuitem"
                onClick={() => setMenuOpen(false)}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-[9px] px-3 py-2.5 text-[13.5px] font-semibold no-underline transition',
                  isDark
                    ? 'text-idl-design-muted hover:bg-white/6 hover:text-idl-glow'
                    : 'text-idl-graphite-2 hover:bg-[#faf6ef] hover:text-idl-brass',
                )}
              >
                {t(item.labelKey)}
              </Link>
            ))}

            <div className={cn('mx-2 my-1.5 h-px', isDark ? 'bg-white/10' : 'bg-idl-tech-border')} aria-hidden />

            {ACCOUNT_SECONDARY_NAV.map((item) => (
              <Link
                key={item.to}
                to={lp(item.to)}
                role="menuitem"
                onClick={() => setMenuOpen(false)}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-[9px] px-3 py-2.5 text-[13.5px] font-semibold no-underline transition',
                  isDark
                    ? 'text-idl-design-muted hover:bg-white/6 hover:text-idl-glow'
                    : 'text-idl-graphite-2 hover:bg-[#faf6ef] hover:text-idl-brass',
                )}
              >
                {t(item.labelKey)}
              </Link>
            ))}

            <div className={cn('mx-2 my-1.5 h-px', isDark ? 'bg-white/10' : 'bg-idl-tech-border')} aria-hidden />

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false)
                requestLogout()
              }}
              className={cn(
                ui.navButton,
                'flex w-full items-center gap-2.5 rounded-[9px] px-3 py-2.5 text-left text-[13.5px] font-bold',
                isDark
                  ? 'text-idl-glow hover:bg-white/6'
                  : 'text-idl-brass hover:bg-[#faf6ef]',
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
