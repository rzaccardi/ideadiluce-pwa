'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { Link } from '@/lib/navigation'
import { useSnapshot } from 'valtio/react'
import { authStore, checkoutRegister, login } from '@/features/auth'
import type { ClearClientSessionScope } from '@/features/auth'
import { useLogoutConfirm } from '@/hooks/use-logout-confirm'
import { useI18n } from '@/hooks/use-i18n'
import { useLocalePath } from '@/hooks/use-locale-path'
import { ApiRequestError } from '@/types/api'
import {
  CheckoutActionRow,
  StripeErrorBanner,
  StripeFieldGroup,
  StripeInput,
  StripePayButton,
  StripeSectionTitle,
} from '@/components/checkout/stripe-ui/StripeFields'

export type InlineAuthSuccessInfo = {
  mode: 'register' | 'login'
  email: string
  firstName?: string
  lastName?: string
  phone?: string
}

type Props = {
  email: string
  onEmailChange: (email: string) => void
  forgotPasswordFrom: string
  title: ReactNode
  hint?: ReactNode
  registerContinueLabel?: string
  loginContinueLabel?: string
  onAuthSuccess?: (info: InlineAuthSuccessInfo) => void | Promise<void>
  /** Se true, mostra riepilogo account + pulsante continua (checkout). Altrimenti solo callback. */
  showAuthenticatedContinue?: boolean
  authenticatedContinueLabel?: string
  authenticatedContinueLoading?: boolean
  onAuthenticatedContinue?: () => void | Promise<void>
  logoutScope?: ClearClientSessionScope
  initialMode?: 'register' | 'login'
}

export function InlineAccountAuthStep({
  email,
  onEmailChange,
  forgotPasswordFrom,
  title,
  hint,
  registerContinueLabel,
  loginContinueLabel,
  onAuthSuccess,
  showAuthenticatedContinue = false,
  authenticatedContinueLabel,
  authenticatedContinueLoading = false,
  onAuthenticatedContinue,
  logoutScope,
  initialMode = 'register',
}: Props) {
  const { t } = useI18n()
  const lp = useLocalePath()
  const auth = useSnapshot(authStore)
  const { requestLogout, logoutDialog } = useLogoutConfirm({ scope: logoutScope })
  const [mode, setMode] = useState<'register' | 'login'>(initialMode)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  useEffect(() => {
    if (email && !loginEmail) setLoginEmail(email)
  }, [email, loginEmail])

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const trimmedEmail = email.trim()
    try {
      await checkoutRegister({
        email: trimmedEmail,
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
      })
      await onAuthSuccess?.({
        mode: 'register',
        email: trimmedEmail,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
      })
    } catch (err) {
      if (err instanceof ApiRequestError && err.code === 'EMAIL_TAKEN') {
        setMode('login')
        setLoginEmail(trimmedEmail)
        onEmailChange(trimmedEmail)
        setError(err.userMessage ?? err.message)
      } else {
        setError(
          err instanceof ApiRequestError ? (err.userMessage ?? err.message) : t('checkout.account.registerError'),
        )
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const trimmedEmail = loginEmail.trim()
    try {
      await login(trimmedEmail, loginPassword)
      await onAuthSuccess?.({
        mode: 'login',
        email: trimmedEmail,
      })
    } catch (err) {
      setError(
        err instanceof ApiRequestError ? (err.userMessage ?? err.message) : t('checkout.account.loginError'),
      )
    } finally {
      setLoading(false)
    }
  }

  if (auth.isAuthenticated && auth.me) {
    const displayName =
      [auth.me.firstName, auth.me.lastName].filter(Boolean).join(' ') || auth.me.email

    if (!showAuthenticatedContinue) {
      return null
    }

    return (
      <section className="space-y-4">
        <StripeSectionTitle>{title}</StripeSectionTitle>
        <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-zinc-900">{displayName}</p>
              <p className="truncate text-zinc-500">{auth.me.email}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setError(null)
                requestLogout()
              }}
              className="shrink-0 text-zinc-900 underline decoration-zinc-300 underline-offset-2 hover:decoration-zinc-900"
            >
              {t('nav.logout')}
            </button>
          </div>
        </div>
        <CheckoutActionRow>
          <StripePayButton
            className="w-full"
            loading={authenticatedContinueLoading}
            disabled={authenticatedContinueLoading}
            onClick={() => void onAuthenticatedContinue?.()}
          >
            {authenticatedContinueLabel ?? t('checkout.continue')}
          </StripePayButton>
        </CheckoutActionRow>
        {logoutDialog}
      </section>
    )
  }

  const forgotHref = `${lp('/forgot-password')}?from=${encodeURIComponent(forgotPasswordFrom)}`

  return (
    <section className="space-y-4">
      <StripeSectionTitle>{title}</StripeSectionTitle>
      {hint ? <p className="text-sm text-zinc-500">{hint}</p> : null}

      {error ? <StripeErrorBanner message={error} /> : null}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setMode('register')
            setError(null)
          }}
          className={`rounded-full px-3 py-1.5 text-sm font-medium ${
            mode === 'register' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600'
          }`}
        >
          {t('checkout.account.registerTab')}
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('login')
            setError(null)
          }}
          className={`rounded-full px-3 py-1.5 text-sm font-medium ${
            mode === 'login' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600'
          }`}
        >
          {t('checkout.account.loginTab')}
        </button>
      </div>

      {mode === 'register' ? (
        <form onSubmit={(e) => void handleRegister(e)} className="space-y-3">
          <StripeFieldGroup>
            <StripeInput
              type="email"
              name="email"
              placeholder={t('checkout.emailPlaceholder')}
              autoComplete="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              required
            />
          </StripeFieldGroup>
          <div className="grid gap-3 sm:grid-cols-2">
            <StripeFieldGroup>
              <StripeInput
                name="firstName"
                placeholder={t('checkout.register.firstName')}
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </StripeFieldGroup>
            <StripeFieldGroup>
              <StripeInput
                name="lastName"
                placeholder={t('checkout.register.lastName')}
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </StripeFieldGroup>
          </div>
          <StripeFieldGroup>
            <StripeInput
              type="tel"
              name="phone"
              placeholder={t('checkout.address.phoneOptional')}
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </StripeFieldGroup>
          <StripeFieldGroup>
            <StripeInput
              type="password"
              name="password"
              placeholder={t('register.passwordHint')}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </StripeFieldGroup>
          <p className="text-xs text-zinc-500">{t('checkout.account.createHint')}</p>
          <CheckoutActionRow>
            <StripePayButton
              className="w-full"
              disabled={loading || !email.includes('@') || password.length < 8}
              loading={loading}
              onClick={() => void handleRegister({ preventDefault: () => {} } as React.FormEvent)}
            >
              {registerContinueLabel ?? t('checkout.account.createAndContinue')}
            </StripePayButton>
          </CheckoutActionRow>
        </form>
      ) : (
        <form onSubmit={(e) => void handleLogin(e)} className="space-y-3">
          <StripeFieldGroup>
            <StripeInput
              type="email"
              name="login-email"
              placeholder={t('common.email')}
              autoComplete="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              required
            />
          </StripeFieldGroup>
          <StripeFieldGroup>
            <StripeInput
              type="password"
              name="login-password"
              placeholder={t('common.password')}
              autoComplete="current-password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
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
          <CheckoutActionRow>
            <StripePayButton
              className="w-full"
              disabled={loading}
              loading={loading}
              onClick={() => void handleLogin({ preventDefault: () => {} } as React.FormEvent)}
            >
              {loading ? t('auth.loggingIn') : (loginContinueLabel ?? t('auth.loginSubmit'))}
            </StripePayButton>
          </CheckoutActionRow>
        </form>
      )}
      {logoutDialog}
    </section>
  )
}
