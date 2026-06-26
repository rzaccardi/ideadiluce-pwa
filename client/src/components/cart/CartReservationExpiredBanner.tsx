'use client'

import { useSnapshot } from 'valtio/react'
import { cartStore, dismissReservationExpiredNotice } from '@/features/cart'
import { Button } from '@/components/Button'
import { useI18n } from '@/hooks/use-i18n'

export function CartReservationExpiredBanner({ className }: { className?: string }) {
  const { t } = useI18n()
  const { reservationExpiredNotice } = useSnapshot(cartStore)
  if (!reservationExpiredNotice) return null

  return (
    <div
      className={`rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 ${className ?? ''}`}
      role="alert"
    >
      <p className="font-medium">{t('cart.reservationExpired.title')}</p>
      <p className="mt-1 text-amber-900/90">{t('cart.reservationExpired.description')}</p>
      <Button
        variant="secondary"
        size="sm"
        className="mt-3"
        onClick={() => dismissReservationExpiredNotice()}
      >
        {t('cart.reservationExpired.dismiss')}
      </Button>
    </div>
  )
}
