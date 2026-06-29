'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { api } from '@/api/endpoints'
import { useIsClient } from '@/hooks/use-is-client'
import {
  CheckoutActionRow,
  StripeErrorBanner,
  StripeFieldGroup,
  StripeInput,
  StripePayButton,
} from '@/components/checkout/stripe-ui/StripeFields'
import { useI18n } from '@/hooks/use-i18n'
import { cn } from '@/utils/cn'

type Props = {
  open: boolean
  initialEmail?: string
  onClose: () => void
}

export function ForgotPasswordModal({ open, initialEmail = '', onClose }: Props) {
  const { t } = useI18n()
  const isClient = useIsClient()
  const [email, setEmail] = useState(initialEmail)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setEmail(initialEmail.trim())
    setError(null)
    setSent(false)
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await api.auth.forgotPassword(email.trim())
      setSent(true)
    } catch {
      setError(t('forgot.error'))
    } finally {
      setLoading(false)
    }
  }

  if (!open || !isClient) return null

  return createPortal(
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
        aria-labelledby="forgot-password-title"
        className={cn(
          'flex h-full w-full flex-col bg-idl-tech-panel sm:h-auto sm:max-h-[min(100dvh,640px)] sm:max-w-md sm:overflow-hidden sm:rounded-2xl sm:shadow-xl sm:shadow-idl-ink/10',
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-idl-tech-border px-4 py-3.5 sm:px-6">
          <h2 id="forgot-password-title" className="text-lg font-extrabold tracking-[-0.01em] text-idl-graphite">
            {t('forgot.title')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg px-2 py-1 text-sm font-semibold text-idl-muted hover:text-idl-graphite disabled:opacity-50"
          >
            {t('common.close')}
          </button>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
          {sent ? (
            <p className="text-sm leading-relaxed text-[#5b616b]">{t('forgot.sentMessage')}</p>
          ) : (
            <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
              {error ? <StripeErrorBanner message={error} /> : null}
              <StripeFieldGroup>
                <StripeInput
                  type="email"
                  name="forgot-email"
                  placeholder={t('common.email')}
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </StripeFieldGroup>
              <CheckoutActionRow>
                <StripePayButton className="w-full" disabled={loading || !email.includes('@')} loading={loading}>
                  {t('forgot.submit')}
                </StripePayButton>
              </CheckoutActionRow>
            </form>
          )}

          {sent ? (
            <CheckoutActionRow className="mt-6">
              <StripePayButton className="w-full" onClick={onClose}>
                {t('common.close')}
              </StripePayButton>
            </CheckoutActionRow>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  )
}
