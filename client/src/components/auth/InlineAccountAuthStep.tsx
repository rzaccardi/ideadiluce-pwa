'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useSnapshot } from 'valtio/react'
import { authStore, checkoutLogin, checkoutRegister } from '@/features/auth'
import type { ClearClientSessionScope } from '@/features/auth'
import {
  checkoutStore,
  isBusinessAnagraficaComplete,
  setCustomerSegment,
  validateTaxFields,
} from '@/features/checkout'
import type { CustomerSegmentChoice } from '@/features/checkout'
import { useForgotPasswordModal } from '@/hooks/use-forgot-password-modal'
import { useLogoutConfirm } from '@/hooks/use-logout-confirm'
import { useI18n } from '@/hooks/use-i18n'
import { ApiRequestError } from '@/types/api'
import { CheckoutBusinessFieldsSection } from '@/components/checkout/stripe-ui/CheckoutBusinessFieldsSection'
import { CheckoutRetailFiscalCodeField } from '@/components/checkout/stripe-ui/CheckoutRetailFiscalCodeField'
import { CheckoutCustomerTypeCards } from '@/components/checkout/stripe-ui/CheckoutCustomerTypeCards'
import {
  CheckoutActionRow,
  StripeControlledInput,
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
  customerSegment?: CustomerSegmentChoice
}

type Props = {
  email: string
  onEmailChange: (email: string) => void
  title?: ReactNode
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
  /** Checkout: login in alto + registrazione sotto con tab privato/azienda. */
  collectCustomerTypeOnRegister?: boolean
}

function AuthSubheading({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-sm font-extrabold tracking-[-0.01em] text-idl-graphite">{children}</h3>
  )
}

function AuthDivider({ label }: { label: string }) {
  return (
    <div className="relative py-1">
      <div className="absolute inset-0 flex items-center" aria-hidden>
        <div className="w-full border-t border-idl-tech-border" />
      </div>
      <p className="relative mx-auto w-fit bg-idl-tech-panel px-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#9298a3]">
        {label}
      </p>
    </div>
  )
}

export function InlineAccountAuthStep({
  email,
  onEmailChange,
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
  collectCustomerTypeOnRegister = false,
}: Props) {
  const { t } = useI18n()
  const auth = useSnapshot(authStore)
  const { requestLogout, logoutDialog } = useLogoutConfirm({ scope: logoutScope })
  const { openForgotPassword, forgotPasswordModal } = useForgotPasswordModal()
  const [mode, setMode] = useState<'register' | 'login'>(initialMode)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [registerError, setRegisterError] = useState<string | null>(null)
  const [loginLoading, setLoginLoading] = useState(false)
  const [registerLoading, setRegisterLoading] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [typeChoice, setTypeChoice] = useState<'retail' | 'business'>('retail')
  const [postAuthPending, setPostAuthPending] = useState(false)
  const formsLocked = postAuthPending || authenticatedContinueLoading

  useEffect(() => {
    if (email && !loginEmail) setLoginEmail(email)
  }, [email, loginEmail])

  useEffect(() => {
    if (!collectCustomerTypeOnRegister) return
    if (checkoutStore.customerSegment == null) {
      setCustomerSegment('retail')
    }
  }, [collectCustomerTypeOnRegister])

  function handleTypeChange(value: 'retail' | 'business') {
    setTypeChoice(value)
    setCustomerSegment(value)
    setRegisterError(null)
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setRegisterError(null)
    setRegisterLoading(true)
    if (collectCustomerTypeOnRegister) {
      checkoutStore.initLoadingPhase = 'account'
    }

    const clearAuthLoading = () => {
      setRegisterLoading(false)
      if (collectCustomerTypeOnRegister && checkoutStore.initLoadingPhase === 'account') {
        checkoutStore.initLoadingPhase = null
      }
    }

    const segment = typeChoice
    setCustomerSegment(segment)

    if (segment === 'business') {
      try {
        await validateTaxFields()
      } catch {
        setRegisterError(t('checkout.error.incompleteStep'))
        clearAuthLoading()
        return
      }
      if (!isBusinessAnagraficaComplete()) {
        setRegisterError(t('checkout.error.incompleteStep'))
        clearAuthLoading()
        return
      }
    }

    if (collectCustomerTypeOnRegister && segment === 'retail' && checkoutStore.business.fiscalCode.trim()) {
      try {
        await validateTaxFields()
      } catch {
        setRegisterError(t('checkout.error.incompleteStep'))
        clearAuthLoading()
        return
      }
      if (!isBusinessAnagraficaComplete()) {
        setRegisterError(t('checkout.error.incompleteStep'))
        clearAuthLoading()
        return
      }
    }

    const trimmedEmail = email.trim()
    try {
      await checkoutRegister({
        email: trimmedEmail,
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
        customerSegment: collectCustomerTypeOnRegister ? segment : undefined,
      })
      setPostAuthPending(true)
      try {
        await onAuthSuccess?.({
          mode: 'register',
          email: trimmedEmail,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim() || undefined,
          customerSegment: collectCustomerTypeOnRegister ? segment : undefined,
        })
      } finally {
        setPostAuthPending(false)
      }
    } catch (err) {
      clearAuthLoading()
      if (err instanceof ApiRequestError && err.code === 'EMAIL_TAKEN') {
        setLoginEmail(trimmedEmail)
        onEmailChange(trimmedEmail)
        setLoginError(err.userMessage ?? err.message)
        setRegisterError(null)
      } else {
        setRegisterError(
          err instanceof ApiRequestError ? (err.userMessage ?? err.message) : t('checkout.account.registerError'),
        )
      }
      return
    } finally {
      setRegisterLoading(false)
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoginError(null)
    setLoginLoading(true)
    if (collectCustomerTypeOnRegister) {
      checkoutStore.initLoadingPhase = 'account'
    }
    const trimmedEmail = loginEmail.trim()
    try {
      await checkoutLogin(trimmedEmail, loginPassword)
      setPostAuthPending(true)
      try {
        await onAuthSuccess?.({
          mode: 'login',
          email: trimmedEmail,
        })
      } finally {
        setPostAuthPending(false)
      }
    } catch (err) {
      if (collectCustomerTypeOnRegister && checkoutStore.initLoadingPhase === 'account') {
        checkoutStore.initLoadingPhase = null
      }
      setLoginPassword('')
      onEmailChange(trimmedEmail)
      setLoginError(
        err instanceof ApiRequestError ? (err.userMessage ?? err.message) : t('checkout.account.loginError'),
      )
    } finally {
      setLoginLoading(false)
    }
  }

  if (auth.isAuthenticated && auth.me) {
    if (formsLocked && collectCustomerTypeOnRegister) {
      // Mantieni il form anagrafica visibile sotto il loader checkout.
    } else if (formsLocked) {
      return (
        <section className="space-y-4">
          <CheckoutActionRow>
            <StripePayButton className="w-full" loading disabled>
              {authenticatedContinueLabel ?? t('checkout.continue')}
            </StripePayButton>
          </CheckoutActionRow>
        </section>
      )
    } else if (!showAuthenticatedContinue) {
      return null
    } else {
      const displayName =
        [auth.me.firstName, auth.me.lastName].filter(Boolean).join(' ') || auth.me.email

      return (
        <section className="space-y-4">
          {title ? <StripeSectionTitle>{title}</StripeSectionTitle> : null}
          <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-zinc-900">{displayName}</p>
                <p className="truncate text-zinc-500">{auth.me.email}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setLoginError(null)
                  setRegisterError(null)
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
          {forgotPasswordModal}
        </section>
      )
    }
  }

  const loginForm = (
    <form onSubmit={(e) => void handleLogin(e)} className="space-y-3">
      <StripeFieldGroup>
        <StripeInput
          type="email"
          name="login-email"
          placeholder={t('common.email')}
          autoComplete="email"
          value={loginEmail}
          onChange={(e) => {
            const next = e.target.value
            setLoginEmail(next)
            onEmailChange(next)
          }}
          required
          disabled={formsLocked}
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
          disabled={formsLocked}
        />
      </StripeFieldGroup>
      <p className="text-right text-sm">
        <button
          type="button"
          onClick={() => openForgotPassword(loginEmail)}
          className="text-zinc-900 underline decoration-zinc-300 underline-offset-2 hover:decoration-zinc-900"
        >
          {t('login.forgot')}
        </button>
      </p>
      <CheckoutActionRow>
        <StripePayButton
          className="w-full"
          disabled={loginLoading || formsLocked}
          loading={loginLoading}
          onClick={() => void handleLogin({ preventDefault: () => {} } as React.FormEvent)}
        >
          {loginLoading ? t('auth.loggingIn') : (loginContinueLabel ?? t('auth.loginSubmit'))}
        </StripePayButton>
      </CheckoutActionRow>
    </form>
  )

  const registerForm = (
    <form onSubmit={(e) => void handleRegister(e)} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <StripeFieldGroup>
          <StripeInput
            name="firstName"
            placeholder={t('checkout.register.firstName')}
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            disabled={formsLocked}
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
            disabled={formsLocked}
          />
        </StripeFieldGroup>
      </div>
      {collectCustomerTypeOnRegister && typeChoice === 'business' ? (
        <CheckoutBusinessFieldsSection disabled={registerLoading || formsLocked} embedded />
      ) : null}
      {collectCustomerTypeOnRegister && typeChoice === 'retail' ? (
        <CheckoutRetailFiscalCodeField disabled={registerLoading || formsLocked} />
      ) : null}
      <StripeFieldGroup>
        <StripeControlledInput
          type="email"
          name="email"
          placeholder={t('checkout.emailPlaceholder')}
          autoComplete="email"
          value={email}
          onValueChange={onEmailChange}
          required
          disabled={formsLocked}
        />
      </StripeFieldGroup>
      <StripeFieldGroup>
        <StripeInput
          type="tel"
          name="phone"
          placeholder={t('checkout.address.phoneOptional')}
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={formsLocked}
        />
      </StripeFieldGroup>
      <div className="space-y-1.5">
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
            disabled={formsLocked}
            aria-invalid={password.length > 0 && password.length < 8}
            aria-describedby={
              password.length > 0 && password.length < 8 ? 'checkout-password-too-short' : undefined
            }
          />
        </StripeFieldGroup>
        {password.length > 0 && password.length < 8 ? (
          <p id="checkout-password-too-short" className="px-1 text-xs text-red-700" role="alert">
            {t('register.passwordTooShort')}
          </p>
        ) : null}
      </div>
      <CheckoutActionRow>
        <StripePayButton
          className="w-full"
          disabled={registerLoading || formsLocked || !email.includes('@') || password.length < 8}
          loading={registerLoading}
          onClick={() => void handleRegister({ preventDefault: () => {} } as React.FormEvent)}
        >
          {registerContinueLabel ?? t('checkout.account.createAndContinue')}
        </StripePayButton>
      </CheckoutActionRow>
    </form>
  )

  if (collectCustomerTypeOnRegister) {
    return (
      <section className="space-y-6" aria-busy={formsLocked}>
        <div className="space-y-3">
          <AuthSubheading>{t('checkout.account.loginTab')}</AuthSubheading>
          {loginError ? <StripeErrorBanner message={loginError} /> : null}
          {loginForm}
        </div>

        <AuthDivider label={t('checkout.account.orDivider')} />

        <div className="space-y-4">
          <AuthSubheading>{t('checkout.account.registerTab')}</AuthSubheading>
          <CheckoutCustomerTypeCards
            variant="tabs"
            value={typeChoice}
            onChange={handleTypeChange}
            disabled={registerLoading || formsLocked}
          />
          {registerError ? <StripeErrorBanner message={registerError} /> : null}
          {registerForm}
        </div>

        {logoutDialog}
        {forgotPasswordModal}
      </section>
    )
  }

  const error = mode === 'login' ? loginError : registerError

  return (
    <section className="space-y-4">
      {title ? <StripeSectionTitle>{title}</StripeSectionTitle> : null}
      {hint ? <p className="text-sm text-zinc-500">{hint}</p> : null}

      {error ? <StripeErrorBanner message={error} /> : null}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setMode('register')
            setLoginError(null)
            setRegisterError(null)
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
            setLoginError(null)
            setRegisterError(null)
          }}
          className={`rounded-full px-3 py-1.5 text-sm font-medium ${
            mode === 'login' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600'
          }`}
        >
          {t('checkout.account.loginTab')}
        </button>
      </div>

      {mode === 'register' ? registerForm : loginForm}
      {logoutDialog}
      {forgotPasswordModal}
    </section>
  )
}
