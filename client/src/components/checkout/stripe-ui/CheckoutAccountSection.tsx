'use client'

import { useEffect, useState } from 'react'
import { Link } from '@/lib/navigation'
import { useSnapshot } from 'valtio/react'
import { authStore, login } from '@/features/auth'
import { useLogoutConfirm } from '@/hooks/use-logout-confirm'
import { fetchCart } from '@/features/cart'
import {
  checkoutStore,
  prepareCheckoutAfterAuth,
} from '@/features/checkout'
import { useI18n } from '@/hooks/use-i18n'
import { useLocalePath } from '@/hooks/use-locale-path'
import { ApiRequestError } from '@/types/api'
import { StripeErrorBanner, StripeFieldGroup, StripeControlledInput } from './StripeFields'

/** Login email/password nel checkout (sezione compatta). */
export function CheckoutAccountSection() {
  const { t } = useI18n()
  const lp = useLocalePath()
  const auth = useSnapshot(authStore)
  const checkout = useSnapshot(checkoutStore)
  const { requestLogout, logoutDialog } = useLogoutConfirm({ scope: 'checkout' })
  const [showLogin, setShowLogin] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (showLogin && !loginEmail && checkout.draft.email) {
      setLoginEmail(checkout.draft.email)
    }
  }, [showLogin, loginEmail, checkout.draft.email])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(loginEmail.trim(), loginPassword)
      await prepareCheckoutAfterAuth()
      await fetchCart({ force: true })
      setShowLogin(false)
      setLoginPassword('')
    } catch (err) {
      setError(
        err instanceof ApiRequestError ? (err.userMessage ?? err.message) : t('checkout.account.loginError'),
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    setError(null)
    requestLogout()
  }

  if (auth.isAuthenticated && auth.me) {
    const displayName =
      [auth.me.firstName, auth.me.lastName].filter(Boolean).join(' ') || auth.me.email
    const initial = (auth.me.firstName?.[0] ?? auth.me.email[0] ?? 'U').toUpperCase()
    return (
      <>
        <div className="flex items-center gap-3 rounded-xl border border-[#e2e6eb] bg-[#f7f8fa] px-3 py-3 sm:px-4">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#14161b] text-sm font-bold text-white">
            {initial}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-[#14161b]">{displayName}</p>
            <p className="truncate text-sm text-[#6c727c]">{auth.me.email}</p>
          </div>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="shrink-0 text-xs font-semibold text-[#9a6a2f] underline decoration-[#cdbfa5] underline-offset-2 hover:decoration-[#9a6a2f] sm:text-sm"
          >
            {t('checkout.account.notYou')}
          </button>
        </div>
        {logoutDialog}
      </>
    )
  }

  if (showLogin) {
    const forgotHref = `${lp('/forgot-password')}?from=${encodeURIComponent(lp('/checkout'))}`
    return (
      <div className="space-y-3 rounded-md border border-zinc-200 bg-zinc-50 p-3">
        {error ? <StripeErrorBanner message={error} /> : null}
        <form onSubmit={(e) => void handleLogin(e)} className="space-y-3">
          <StripeFieldGroup>
            <StripeControlledInput
              type="email"
              name="login-email"
              placeholder={t('common.email')}
              autoComplete="email"
              value={loginEmail}
              onValueChange={setLoginEmail}
              required
            />
          </StripeFieldGroup>
          <StripeFieldGroup>
            <StripeControlledInput
              type="password"
              name="login-password"
              placeholder={t('common.password')}
              autoComplete="current-password"
              value={loginPassword}
              onValueChange={setLoginPassword}
              required
            />
          </StripeFieldGroup>
          <p className="text-right text-sm">
            <Link
              to={forgotHref}
              className="text-zinc-900 underline decoration-zinc-300 underline-offset-2 hover:decoration-zinc-900"
            >
              {t('login.forgot')}
            </Link>
          </p>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-black py-3 text-[15px] font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"
          >
            {loading ? t('auth.loggingIn') : t('auth.loginSubmit')}
          </button>
        </form>
      </div>
    )
  }

  return (
    <>
      <p className="text-sm text-zinc-500">
        {t('checkout.account.requiredHint')}{' '}
        <button
          type="button"
          disabled={loading}
          onClick={() => {
            setLoginEmail(checkout.draft.email)
            setShowLogin(true)
          }}
          className="text-zinc-900 underline decoration-zinc-300 underline-offset-2 hover:decoration-zinc-900"
        >
          {t('checkout.account.loginPrompt')}
        </button>
      </p>
      {logoutDialog}
    </>
  )
}
