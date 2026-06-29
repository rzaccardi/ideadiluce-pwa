'use client'

import { useState } from 'react'
import { api } from '@/api/endpoints'
import { ToastOnError } from '@/components/ToastFeedback'
import { useI18n } from '@/hooks/use-i18n'
import { useLocalePath } from '@/hooks/use-locale-path'
import {
  AuthBodyText,
  AuthBrassLink,
  AuthCard,
  AuthCardHeader,
  AuthField,
  AuthFieldGroup,
  AuthFooterText,
  AuthLabel,
  AuthPageShell,
  AuthSubmitButton,
  AuthTextInput,
  EmailIcon,
} from '@/components/site/auth/auth-ui'

export function ForgotPasswordPageView() {
  const { t } = useI18n()
  const lp = useLocalePath()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await api.auth.forgotPassword(email)
      setSent(true)
    } catch {
      setError(t('forgot.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthPageShell
      footer={
        <AuthFooterText>
          <AuthBrassLink to={lp('/login')}>← {t('login.title')}</AuthBrassLink>
        </AuthFooterText>
      }
    >
      <ToastOnError message={error} />
      <AuthCard>
        <AuthCardHeader title={t('forgot.title')} subtitle={t('forgot.subtitle')} />

        {sent ? (
          <AuthBodyText>{t('forgot.sentMessage')}</AuthBodyText>
        ) : (
          <form onSubmit={(e) => void onSubmit(e)}>
            <AuthFieldGroup className="mb-5 sm:mb-6">
              <AuthLabel htmlFor="forgot-email">{t('common.email')}</AuthLabel>
              <AuthField icon={<EmailIcon />}>
                <AuthTextInput
                  id="forgot-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder={t('auth.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </AuthField>
            </AuthFieldGroup>

            <AuthSubmitButton disabled={loading}>{t('forgot.submit')}</AuthSubmitButton>
          </form>
        )}
      </AuthCard>
    </AuthPageShell>
  )
}
