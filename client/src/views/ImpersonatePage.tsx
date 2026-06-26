'use client'

import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from '@/lib/navigation'
import { exchangeImpersonationToken } from '@/features/auth'
import { useLocalePath } from '@/hooks/use-locale-path'
import { useI18n } from '@/hooks/use-i18n'
import { ImpersonatePageSkeleton } from '@/components/Skeleton'
import { PageLoadTransition } from '@/components/motion'

export function ImpersonatePage() {
  const { t } = useI18n()
  const params = useSearchParams()
  const navigate = useNavigate()
  const lp = useLocalePath()
  const token = params.get('token') ?? ''
  const [error, setError] = useState<string | null>(token ? null : t('impersonate.invalidLink'))

  useEffect(() => {
    if (!token) return

    let cancelled = false
    void exchangeImpersonationToken(token)
      .then(() => {
        if (!cancelled) navigate(lp('/'), { replace: true })
      })
      .catch(() => {
        if (!cancelled) {
          setError(t('impersonate.expiredLink'))
        }
      })

    return () => {
      cancelled = true
    }
  }, [token, navigate, lp, t])

  if (error) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-red-700">{error}</p>
      </div>
    )
  }

  return (
    <PageLoadTransition isLoading skeleton={<ImpersonatePageSkeleton />}>
      {null}
    </PageLoadTransition>
  )
}
