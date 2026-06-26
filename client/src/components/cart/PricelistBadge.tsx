/** Badge listino — nome listino non esposto in storefront (requisito commerciale). */
'use client'

import { useSnapshot } from 'valtio/react'
import { authStore } from '@/features/auth'
import { useI18n } from '@/hooks/use-i18n'

export function PricelistBadge() {
  return null
}

export function ProfessionalCartBanner({ className }: { className?: string }) {
  const { t } = useI18n()
  const auth = useSnapshot(authStore)
  const user = auth.me
  if (!user?.isProfessional && user?.customerSegment !== 'professional') return null

  return (
    <p
      className={`rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm text-emerald-950 ${className ?? ''}`}
    >
      {t('account.overview.professionalActive')}
    </p>
  )
}
