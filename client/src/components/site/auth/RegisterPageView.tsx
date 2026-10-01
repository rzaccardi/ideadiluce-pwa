'use client'

import { useState } from 'react'
import { useNavigate, useSearchParams } from '@/lib/navigation'
import { useSnapshot } from 'valtio/react'
import { authStore, register } from '@/features/auth'
import { ApiRequestError } from '@/types/api'
import { AuthLoadingOverlay } from '@/components/site/auth/AuthLoadingOverlay'
import { useI18n } from '@/hooks/use-i18n'
import { useLocalePath } from '@/hooks/use-locale-path'
import { notify } from '@/lib/notify'
import {
  AuthBrassLink,
  AuthCard,
  AuthCardHeader,
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
import { cn } from '@/utils/cn'

type AccountType = 'retail' | 'business'

export function RegisterPageView() {
  const { t } = useI18n()
  const lp = useLocalePath()
  const navigate = useNavigate()
  const searchParams = useSearchParams()
  const accountPath = lp('/account')
  const from = searchParams.get('from') ?? accountPath
  const auth = useSnapshot(authStore)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [accountType, setAccountType] = useState<AccountType>(
    searchParams.get('business') === '1' ? 'business' : 'retail',
  )
  const [companyName, setCompanyName] = useState('')
  const [vatNumber, setVatNumber] = useState('')

  const loginHref =
    from !== accountPath
      ? `${lp('/login')}?from=${encodeURIComponent(from)}`
      : lp('/login')

  const isBusy = auth.isLoading || auth.isHydrating
  const busyMessage = auth.isHydrating ? t('auth.preparingAccount') : t('auth.registering')
  const isBusiness = accountType === 'business'

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    authStore.error = null
    if (isBusiness && (!companyName.trim() || !vatNumber.trim())) {
      authStore.error = t('register.businessFieldsRequired')
      return
    }
    try {
      await register(email, password, {
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        customerSegment: accountType,
        companyName: isBusiness ? companyName.trim() : undefined,
        vatNumber: isBusiness ? vatNumber.trim() : undefined,
      })
      notify.success(t('auth.accountCreated'))
      navigate(from, { replace: true })
    } catch (err) {
      if (err instanceof ApiRequestError) {
        authStore.error = err.userMessage ?? err.message
      }
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
      {auth.error ? (
        <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
          {auth.error}
        </p>
      ) : null}
      <AuthCard>
        <AuthCardHeader title={t('register.title')} subtitle={t('register.subtitle')} />

        <form onSubmit={(e) => void onSubmit(e)}>
          <AuthFieldGroup>
            <AuthLabel>{t('register.accountType')}</AuthLabel>
            <div className="grid grid-cols-2 gap-2" role="group" aria-label={t('register.accountType')}>
              <button
                type="button"
                disabled={isBusy}
                onClick={() => setAccountType('retail')}
                className={cn(
                  'rounded-lg border px-3 py-2.5 text-sm font-semibold transition',
                  accountType === 'retail'
                    ? 'border-idl-ink bg-idl-ink text-white'
                    : 'border-[#e4e4df] bg-white text-idl-ink-soft hover:border-idl-ink/40',
                )}
              >
                {t('register.accountTypePrivate')}
              </button>
              <button
                type="button"
                disabled={isBusy}
                onClick={() => setAccountType('business')}
                className={cn(
                  'rounded-lg border px-3 py-2.5 text-sm font-semibold transition',
                  accountType === 'business'
                    ? 'border-idl-ink bg-idl-ink text-white'
                    : 'border-[#e4e4df] bg-white text-idl-ink-soft hover:border-idl-ink/40',
                )}
              >
                {t('register.accountTypeBusiness')}
              </button>
            </div>
          </AuthFieldGroup>

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
                disabled={isBusy}
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
                disabled={isBusy}
              />
            </AuthField>
          </AuthFieldGroup>

          {isBusiness ? (
            <>
              <AuthFieldGroup>
                <AuthLabel htmlFor="register-company-name">{t('checkout.billing.companyName')}</AuthLabel>
                <AuthField icon={<UserIcon />}>
                  <AuthTextInput
                    id="register-company-name"
                    name="companyName"
                    autoComplete="organization"
                    placeholder={t('checkout.billing.companyName')}
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                    disabled={isBusy}
                  />
                </AuthField>
              </AuthFieldGroup>

              <AuthFieldGroup>
                <AuthLabel htmlFor="register-vat-number">{t('checkout.billing.vatNumber')}</AuthLabel>
                <AuthField icon={<UserIcon />}>
                  <AuthTextInput
                    id="register-vat-number"
                    name="vatNumber"
                    autoComplete="off"
                    placeholder={t('checkout.billing.vatNumber')}
                    value={vatNumber}
                    onChange={(e) => setVatNumber(e.target.value)}
                    required
                    disabled={isBusy}
                  />
                </AuthField>
              </AuthFieldGroup>
            </>
          ) : null}

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
                disabled={isBusy}
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
                disabled={isBusy}
                showPasswordLabel={t('login.showPassword')}
                hidePasswordLabel={t('login.hidePassword')}
              />
            </AuthField>
          </AuthFieldGroup>

          <AuthSubmitButton disabled={isBusy}>
            {isBusy ? busyMessage : t('auth.registerSubmit')}
          </AuthSubmitButton>
        </form>
      </AuthCard>
      {isBusy ? (
        <AuthLoadingOverlay
          icon={auth.isHydrating ? 'bulb' : 'shield'}
          messageKey={auth.isHydrating ? 'auth.preparingAccount' : 'auth.registering'}
        />
      ) : null}
    </AuthPageShell>
  )
}
