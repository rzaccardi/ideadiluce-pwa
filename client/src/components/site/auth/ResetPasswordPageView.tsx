'use client'

import { useState } from 'react'
import { completePasswordReset } from '@/features/auth'
import { ToastOnError } from '@/components/ToastFeedback'
import { useI18n } from '@/hooks/use-i18n'
import { useLocalePath } from '@/hooks/use-locale-path'
import { useNavigate, useSearchParams } from '@/lib/navigation'
import { notify } from '@/lib/notify'
import { ApiRequestError } from '@/types/api'
import {
  AuthBodyText,
  AuthBrassLink,
  AuthCard,
  AuthCardHeader,
  AuthField,
  AuthFieldGroup,
  AuthFooterMuted,
  AuthFooterText,
  AuthLabel,
  AuthPageShell,
  AuthPasswordInput,
  AuthSubmitButton,
  LockIcon,
} from '@/components/site/auth/auth-ui'

export function ResetPasswordPageView() {
  const { t } = useI18n()
  const lp = useLocalePath()
  const navigate = useNavigate()
  const searchParams = useSearchParams()
  /** Token opaco Odoo: non validare lunghezza/formato; solo presenza dopo decode URL. */
  const token = (searchParams.get('token') ?? '').trim()
  const emailFromLink = (searchParams.get('email') ?? '').trim()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  const hasToken = token.length > 0

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!hasToken) {
      setError(t('reset.invalidLink'))
      return
    }
    if (password.length < 8) {
      setError(t('register.passwordTooShort'))
      return
    }
    if (password !== confirmPassword) {
      setError(t('reset.mismatch'))
      return
    }

    setLoading(true)
    try {
      const { loggedIn } = await completePasswordReset(token, password)
      if (loggedIn) {
        notify.success(t('auth.loggedIn'))
        navigate(lp('/account'), { replace: true })
        return
      }
      setDone(true)
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.code === 'INVALID_RESET_TOKEN') {
          setError(t('reset.expiredLink'))
        } else {
          setError(err.userMessage ?? err.message ?? t('reset.error'))
        }
      } else {
        setError(t('reset.error'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthPageShell
      footer={
        <>
          <AuthFooterText>
            <AuthBrassLink to={lp('/forgot-password')}>
              {t('reset.requestNewLink')} →
            </AuthBrassLink>
          </AuthFooterText>
          <AuthFooterMuted>
            <AuthBrassLink to={lp('/login')}>← {t('login.title')}</AuthBrassLink>
          </AuthFooterMuted>
        </>
      }
    >
      <ToastOnError message={error} />
      <AuthCard>
        <AuthCardHeader
          title={t('reset.title')}
          subtitle={emailFromLink || undefined}
        />

        {!hasToken ? (
          <AuthBodyText>{t('reset.invalidLink')}</AuthBodyText>
        ) : done ? (
          <AuthBodyText>
            {t('reset.success')}{' '}
            <AuthBrassLink to={lp('/login')}>{t('login.title')}</AuthBrassLink>
          </AuthBodyText>
        ) : (
          <form onSubmit={(e) => void onSubmit(e)}>
            <AuthFieldGroup>
              <AuthLabel htmlFor="reset-password">{t('reset.passwordLabel')}</AuthLabel>
              <AuthField icon={<LockIcon />}>
                <AuthPasswordInput
                  id="reset-password"
                  name="password"
                  autoComplete="new-password"
                  placeholder={t('register.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                  showPasswordLabel={t('login.showPassword')}
                  hidePasswordLabel={t('login.hidePassword')}
                />
              </AuthField>
            </AuthFieldGroup>

            <AuthFieldGroup className="mb-5 sm:mb-6">
              <AuthLabel htmlFor="reset-confirm">{t('reset.confirmPassword')}</AuthLabel>
              <AuthField icon={<LockIcon />}>
                <AuthPasswordInput
                  id="reset-confirm"
                  name="confirmPassword"
                  autoComplete="new-password"
                  placeholder={t('register.passwordPlaceholder')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={8}
                  required
                  showPasswordLabel={t('login.showPassword')}
                  hidePasswordLabel={t('login.hidePassword')}
                />
              </AuthField>
            </AuthFieldGroup>

            <AuthSubmitButton disabled={loading}>{t('reset.submit')}</AuthSubmitButton>
          </form>
        )}
      </AuthCard>
    </AuthPageShell>
  )
}
