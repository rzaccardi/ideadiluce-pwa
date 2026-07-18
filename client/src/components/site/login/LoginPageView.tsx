'use client'

import { useState } from 'react'
import { useNavigate, useSearchParams } from '@/lib/navigation'
import { useSnapshot } from 'valtio/react'
import { authStore, login } from '@/features/auth'
import { AuthLoadingOverlay } from '@/components/site/auth/AuthLoadingOverlay'
import { useI18n } from '@/hooks/use-i18n'
import { useLocalePath } from '@/hooks/use-locale-path'
import { notify } from '@/lib/notify'
import { ApiRequestError } from '@/types/api'
import {
  AuthBrassLink,
  AuthCard,
  AuthCardHeader,
  AuthCheckbox,
  AuthField,
  AuthFieldGroup,
  AuthFooterMuted,
  AuthFooterText,
  AuthLabel,
  AuthLabelRow,
  AuthPageShell,
  AuthPasswordInput,
  AuthSubmitButton,
  AuthTextInput,
  EmailIcon,
  LockIcon,
} from '@/components/site/auth/auth-ui'

export function LoginPageView() {
  const { t } = useI18n()
  const lp = useLocalePath()
  const navigate = useNavigate()
  const searchParams = useSearchParams()
  const accountPath = lp('/account')
  const from = searchParams.get('from') ?? accountPath
  const auth = useSnapshot(authStore)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)

  const registerHref =
    from !== accountPath
      ? `${lp('/register')}?from=${encodeURIComponent(from)}`
      : lp('/register')

  const isBusy = auth.isLoading || auth.isHydrating
  const busyMessage = auth.isHydrating ? t('auth.preparingAccount') : t('auth.loggingIn')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await login(email, password)
      notify.success(t('auth.loggedIn'))
      navigate(from, { replace: true })
    } catch (err) {
      setPassword('')
      notify.error(
        err instanceof ApiRequestError
          ? (err.userMessage ?? err.message)
          : (authStore.error ?? t('auth.loginError')),
      )
    }
  }

  return (
    <AuthPageShell
      footer={
        <>
          <AuthFooterText>
            {t('auth.noAccount')}{' '}
            <AuthBrassLink to={registerHref}>{t('auth.registerSubmit')}</AuthBrassLink>
          </AuthFooterText>
          <AuthFooterMuted>
            {t('login.professionalPrompt')}{' '}
            <AuthBrassLink to={lp('/professionisti')}>{t('login.professionalCta')}</AuthBrassLink>
          </AuthFooterMuted>
        </>
      }
    >
      <AuthCard>
        <AuthCardHeader title={t('login.welcomeTitle')} subtitle={t('login.subtitle')} />

        <form onSubmit={(e) => void onSubmit(e)}>
          <AuthFieldGroup>
            <AuthLabel htmlFor="login-email">{t('common.email')}</AuthLabel>
            <AuthField icon={<EmailIcon />}>
              <AuthTextInput
                id="login-email"
                type="email"
                name="email"
                autoComplete="email"
                placeholder={t('auth.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isBusy}
              />
            </AuthField>
          </AuthFieldGroup>

          <AuthFieldGroup>
            <AuthLabelRow
              labelFor="login-password"
              label={t('common.password')}
              action={
                <AuthBrassLink to={lp('/forgot-password')} className="text-[12.5px]">
                  {t('login.forgot')}
                </AuthBrassLink>
              }
            />
            <AuthField icon={<LockIcon />}>
              <AuthPasswordInput
                id="login-password"
                name="password"
                autoComplete="current-password"
                placeholder={t('login.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isBusy}
                showPasswordLabel={t('login.showPassword')}
                hidePasswordLabel={t('login.hidePassword')}
              />
            </AuthField>
          </AuthFieldGroup>

          <AuthCheckbox checked={rememberMe} onChange={setRememberMe}>
            {t('login.rememberMe')}
          </AuthCheckbox>

          <AuthSubmitButton disabled={isBusy}>
            {isBusy ? busyMessage : t('auth.loginSubmit')}
          </AuthSubmitButton>
        </form>
      </AuthCard>
      {isBusy ? (
        <AuthLoadingOverlay
          icon={auth.isHydrating ? 'bulb' : 'shield'}
          messageKey={auth.isHydrating ? 'auth.preparingAccount' : 'auth.loggingIn'}
        />
      ) : null}
    </AuthPageShell>
  )
}
