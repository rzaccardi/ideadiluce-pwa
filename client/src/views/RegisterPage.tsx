'use client'

import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from '@/lib/navigation'
import { useSnapshot } from 'valtio/react'
import { authStore, register } from '@/features/auth'
import { TextInput } from '@/components/TextInput'
import { Button } from '@/components/Button'
import { AUTH_FORM_CONTAINER_CLASS } from '@/components/Container'
import { ToastOnError } from '@/components/ToastFeedback'
import { PageHeader } from '@/components/PageHeader'
import { FadeIn } from '@/components/motion'
import { useI18n } from '@/hooks/use-i18n'
import { useLocalePath } from '@/hooks/use-locale-path'

export function RegisterPage() {
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
      /* errore in authStore.error */
    }
  }

  return (
    <FadeIn>
    <div className={AUTH_FORM_CONTAINER_CLASS}>
      <PageHeader title={t('register.title')} />
      <ToastOnError message={auth.error} />
      <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
        <TextInput
          label={t('common.firstName')}
          name="firstName"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <TextInput
          label={t('common.lastName')}
          name="lastName"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
        <TextInput
          label={t('common.email')}
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <TextInput
          label={t('register.passwordHint')}
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
        <label className="flex items-center gap-2 text-sm text-idl-ink-soft">
          <input
            type="checkbox"
            checked={isBusiness}
            onChange={(e) => setIsBusiness(e.target.checked)}
          />
          {t('register.business')}
        </label>
        <Button type="submit" className="w-full" disabled={auth.isLoading}>
          {auth.isLoading ? t('auth.registering') : t('auth.registerSubmit')}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-idl-muted">
        {t('auth.hasAccount')}{' '}
        <Link
          to={`${lp('/login')}${from !== '/' ? `?from=${encodeURIComponent(from)}` : ''}`}
          className="font-medium text-idl-graphite underline"
        >
          {t('nav.login')}
        </Link>
      </p>
    </div>
    </FadeIn>
  )
}
