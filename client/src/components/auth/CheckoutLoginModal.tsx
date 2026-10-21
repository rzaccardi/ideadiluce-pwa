'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { checkoutLogin } from '@/features/auth'
import { fetchCart } from '@/features/cart'
import { checkoutStore, prepareCheckoutAfterAuth, setContactForceLogin } from '@/features/checkout'
import { useForgotPasswordModal } from '@/hooks/use-forgot-password-modal'
import { useIsClient } from '@/hooks/use-is-client'
import { useI18n } from '@/hooks/use-i18n'
import { ApiRequestError } from '@/types/api'
import { cn } from '@/utils/cn'
import {
  CheckoutActionRow,
  StripeErrorBanner,
  StripeFieldGroup,
  StripeInput,
  StripePayButton,
} from '@/components/checkout/stripe-ui/StripeFields'

type Props = {
  open: boolean
  initialEmail?: string
  onClose: () => void
  onSuccess?: () => void | Promise<void>
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none">
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  )
}

export function CheckoutLoginModal({ open, initialEmail = '', onClose, onSuccess }: Props) {
  const { t } = useI18n()
  const isClient = useIsClient()
  const { openForgotPassword, forgotPasswordModal } = useForgotPasswordModal()
  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setEmail(initialEmail.trim())
    setPassword('')
    setError(null)
    setLoading(false)
  }, [open, initialEmail])

  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !loading) onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, loading, onClose])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  async function onSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    const trimmedEmail = email.trim()
    if (!trimmedEmail.includes('@') || !password) {
      setError(t('checkout.error.incompleteStep'))
      return
    }
    setError(null)
    setLoading(true)
    checkoutStore.initLoadingPhase = 'login'
    try {
      await checkoutLogin(trimmedEmail, password)
      // Sessione pronta: chiudi modale subito; cart/prefill non devono bloccare.
      if (checkoutStore.initLoadingPhase === 'login') {
        checkoutStore.initLoadingPhase = null
      }
      setLoading(false)
      setContactForceLogin(false)
      onClose()
      void fetchCart({ force: true }).catch(() => undefined)
      void prepareCheckoutAfterAuth().then(() => onSuccess?.())
    } catch (err) {
      setPassword('')
      setError(
        err instanceof ApiRequestError
          ? (err.userMessage ?? err.message)
          : t('checkout.account.loginError'),
      )
      if (checkoutStore.initLoadingPhase === 'login') {
        checkoutStore.initLoadingPhase = null
      }
      setLoading(false)
    }
  }

  if (!open || !isClient) return null

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[10000] flex h-[100dvh] w-screen flex-col bg-idl-tech-panel sm:items-center sm:justify-center sm:bg-idl-backdrop sm:p-4"
        role="presentation"
        onClick={() => {
          if (!loading) onClose()
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="checkout-login-title"
          className={cn(
            'flex h-full w-full flex-col bg-idl-tech-panel sm:h-auto sm:max-h-[min(100dvh,640px)] sm:max-w-md sm:overflow-hidden sm:rounded-2xl sm:shadow-xl sm:shadow-idl-ink/10',
          )}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-idl-tech-border px-4 py-3.5 sm:px-6">
            <h2
              id="checkout-login-title"
              className="text-lg font-extrabold tracking-[-0.01em] text-idl-graphite"
            >
              {t('login.title')}
            </h2>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              aria-label={t('common.close')}
              className="inline-flex size-9 items-center justify-center rounded-lg text-idl-muted hover:bg-idl-cream hover:text-idl-graphite disabled:opacity-50"
            >
              <CloseIcon className="size-5" />
            </button>
          </div>

          <div className="flex flex-1 flex-col overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
            <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
              {error ? <StripeErrorBanner message={error} /> : null}
              <StripeFieldGroup>
                <StripeInput
                  type="email"
                  name="checkout-login-email"
                  placeholder={t('common.email')}
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </StripeFieldGroup>
              <StripeFieldGroup>
                <StripeInput
                  type="password"
                  name="checkout-login-password"
                  placeholder={t('common.password')}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </StripeFieldGroup>
              <p className="text-right text-sm">
                <button
                  type="button"
                  onClick={() => openForgotPassword(email)}
                  className="text-zinc-900 underline decoration-zinc-300 underline-offset-2 hover:decoration-zinc-900"
                >
                  {t('login.forgot')}
                </button>
              </p>
              <CheckoutActionRow>
                <StripePayButton
                  className="w-full"
                  disabled={loading || !email.includes('@') || !password}
                  loading={loading}
                  onClick={() => void onSubmit()}
                >
                  {loading ? t('auth.loggingIn') : t('auth.loginSubmit')}
                </StripePayButton>
              </CheckoutActionRow>
            </form>
          </div>
        </div>
      </div>
      {forgotPasswordModal}
    </>,
    document.body,
  )
}
