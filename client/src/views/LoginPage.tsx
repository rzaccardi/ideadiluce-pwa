'use client'

import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from '@/lib/navigation'
import { useSnapshot } from 'valtio/react'
import { authStore, login } from '@/features/auth'
import { TextInput } from '@/components/TextInput'
import { Button } from '@/components/Button'
import { PageHeader } from '@/components/PageHeader'
import { FadeIn } from '@/components/motion'
import { useI18n } from '@/hooks/use-i18n'
import { useLocalePath } from '@/hooks/use-locale-path'
import { notify } from '@/lib/notify'

export function LoginPage() {
  const { t } = useI18n()
  const lp = useLocalePath()
  const navigate = useNavigate()
  const searchParams = useSearchParams()
  const from = searchParams.get('from') ?? '/'
  const auth = useSnapshot(authStore)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await login(email, password)
      notify.success(t('auth.loggedIn'))
      navigate(from, { replace: true })
    } catch {
      notify.error(authStore.error ?? t('auth.loginError'))
    }
  }

  return (
    <FadeIn>
    <div className="flex flex-1 flex-col justify-center py-8">
    <div className="mx-auto w-full max-w-md">
      <PageHeader title={t('login.title')} />
      <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
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
          label={t('common.password')}
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <p className="text-right text-sm">
          <Link to={lp('/forgot-password')} className="text-amber-800 hover:underline">
            {t('login.forgot')}
          </Link>
        </p>
        <Button type="submit" className="w-full" disabled={auth.isLoading}>
          {auth.isLoading ? t('auth.loggingIn') : t('auth.loginSubmit')}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-idl-muted">
        {t('auth.noAccount')}{' '}
        <Link to={lp('/register')} className="font-bold text-idl-brass hover:underline">
          {t('auth.registerSubmit')}
        </Link>
      </p>
    </div>
    </div>
    </FadeIn>
  )
}
