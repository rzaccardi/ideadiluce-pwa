'use client'

import { useSnapshot } from 'valtio/react'
import { endImpersonation } from '@/features/auth'
import { authStore } from '@/features/auth/auth.store'
import { useI18n } from '@/hooks/use-i18n'

export function ImpersonationBanner() {
  const auth = useSnapshot(authStore)
  const { t, tParams } = useI18n()

  if (!auth.impersonation || !auth.me) return null

  const label = auth.me.email
  const admin =
    auth.impersonation.adminDisplayName ?? auth.impersonation.adminEmail

  return (
    <div
      role="status"
      className="border-b border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-950"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p>
          {t('impersonation.banner.viewing')}{' '}
          <strong>{label}</strong>
          <span className="text-amber-800">
            {' '}
            {tParams('impersonation.banner.startedBy', { admin })}
          </span>
        </p>
        <button
          type="button"
          onClick={() => void endImpersonation()}
          className="shrink-0 rounded-md border border-amber-400 bg-idl-tech-panel px-3 py-1.5 font-medium text-amber-950 hover:bg-amber-100"
        >
          {t('impersonation.banner.end')}
        </button>
      </div>
    </div>
  )
}
