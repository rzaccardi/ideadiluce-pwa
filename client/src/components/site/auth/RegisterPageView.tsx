'use client'

import { useState } from 'react'
import { useNavigate, useSearchParams } from '@/lib/navigation'
import { useSnapshot } from 'valtio/react'
import { authStore, register } from '@/features/auth'
import { ToastOnError } from '@/components/ToastFeedback'
import { useI18n } from '@/hooks/use-i18n'
import { useLocalePath } from '@/hooks/use-locale-path'
import {
  AuthBrassLink,
  AuthCard,
  AuthCardHeader,
  AuthCheckbox,
  AuthField,
  AuthFieldGroup,
  AuthFooterText,
  AuthLabel,
  AuthPageShell,
  AuthPasswordInput,
  AuthSubmitButton,
  AuthTextInput,
  EmailIcon,
  LockIcon,
  UserIcon,
} from '@/components/site/auth/auth-ui'

export function RegisterPageView() {
  const { t } = useI18n()
  const lp = useLocalePath()
  const navigate = useNavigate()
  const searchParams = useSearchParams()
  const from = searchParams.get('from') ?? '/'
  const auth = useSnapshot(authStore)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [isBusiness, setIsBusiness] = useState(searchParams.get('business') === '1')

  const loginHref =
    from !== '/'
      ? `${lp('/login')}?from=${encodeURIComponent(from)}`
      : lp('/login')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await register(email, password, {
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        customerSegment: isBusiness ? 'business' : 'retail',
      })
      navigate(from, { replace: true })
    } catch {
      // error shown via ToastOnError
    }
  }

  return (
    <AuthPageShell
      footer={
        <AuthFooterText>
          {t('auth.hasAccount')}{' '}
          <AuthBrassLink to={loginHref}>{t('nav.login')}</AuthBrassLink>
        </AuthFooterText>
      }
    >
      <ToastOnError message={auth.error} />
      <AuthCard>
        <AuthCardHeader title={t('register.title')} subtitle={t('register.subtitle')} />

        <form onSubmit={(e) => void onSubmit(e)}>
          <AuthFieldGroup>
            <AuthLabel htmlFor="register-first-name">{t('common.firstName')}</AuthLabel>
            <AuthField icon={<UserIcon />}>
              <AuthTextInput
                id="register-first-name"
                name="firstName"
                autoComplete="given-name"
                placeholder={t('auth.firstNamePlaceholder')}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </AuthField>
          </AuthFieldGroup>

          <AuthFieldGroup>
            <AuthLabel htmlFor="register-last-name">{t('common.lastName')}</AuthLabel>
            <AuthField icon={<UserIcon />}>
              <AuthTextInput
                id="register-last-name"
                name="lastName"
                autoComplete="family-name"
                placeholder={t('auth.lastNamePlaceholder')}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </AuthField>
          </AuthFieldGroup>

          <AuthFieldGroup>
            <AuthLabel htmlFor="register-email">{t('common.email')}</AuthLabel>
            <AuthField icon={<EmailIcon />}>
              <AuthTextInput
                id="register-email"
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

          <AuthFieldGroup className="mb-5 sm:mb-[22px]">
            <AuthLabel htmlFor="register-password">{t('register.passwordHint')}</AuthLabel>
            <AuthField icon={<LockIcon />}>
              <AuthPasswordInput
                id="register-password"
                name="password"
                autoComplete="new-password"
                placeholder={t('register.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                showPasswordLabel={t('login.showPassword')}
                hidePasswordLabel={t('login.hidePassword')}
              />
            </AuthField>
          </AuthFieldGroup>

          <AuthCheckbox checked={isBusiness} onChange={setIsBusiness}>
            {t('register.business')}
          </AuthCheckbox>

          <AuthSubmitButton disabled={auth.isLoading}>
            {auth.isLoading ? t('auth.registering') : t('auth.registerSubmit')}
          </AuthSubmitButton>
        </form>
      </AuthCard>
    </AuthPageShell>
  )
}
