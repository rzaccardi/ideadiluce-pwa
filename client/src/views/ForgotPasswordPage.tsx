'use client'

import { useState } from 'react'
import { Link } from '@/lib/navigation'
import { api } from '@/api/endpoints'
import { Button } from '@/components/Button'
import { AUTH_FORM_CONTAINER_CLASS } from '@/components/Container'
import { ToastOnError } from '@/components/ToastFeedback'
import { PageHeader } from '@/components/PageHeader'
import { FadeIn } from '@/components/motion'
import { TextInput } from '@/components/TextInput'
import { useI18n } from '@/hooks/use-i18n'
import { useLocalePath } from '@/hooks/use-locale-path'

export function ForgotPasswordPage() {
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
    <FadeIn>
    <div className={AUTH_FORM_CONTAINER_CLASS}>
      <PageHeader title={t('forgot.title')} />
      <ToastOnError message={error} />
      {sent ? (
        <p className="text-stone-700">{t('forgot.sentMessage')}</p>
      ) : (
        <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
          <TextInput
            label={t('common.email')}
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" disabled={loading}>
            {t('forgot.submit')}
          </Button>
        </form>
      )}
      <p className="mt-4 text-sm">
        <Link to={lp('/login')} className="text-amber-800 hover:underline">
          ← {t('login.title')}
        </Link>
      </p>
    </div>
    </FadeIn>
  )
}
