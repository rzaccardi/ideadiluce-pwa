'use client'

import { useEffect } from 'react'
import { Link } from '@/lib/navigation'
import { useSnapshot } from 'valtio/react'
import { fetchOrdersList, ordersStore } from '@/features/orders'
import { AccountDcOrderCard } from '@/components/account/dc/AccountDcOrderCard'
import { AccountDcPanel } from '@/components/account/dc/AccountDcPanel'
import { accountDcPrimaryBtnClass } from '@/components/account/dc/account-dc-styles'
import { StripeErrorBanner } from '@/components/checkout/stripe-ui/StripeFields'
import { ListSkeleton } from '@/components/Skeleton'
import { PageLoadTransition } from '@/components/motion'
import { useI18n } from '@/hooks/use-i18n'

export function OrdersPage() {
  const { t } = useI18n()
  const orders = useSnapshot(ordersStore)
  const isLoading = orders.isListLoading || orders.list === null

  useEffect(() => {
    void fetchOrdersList()
  }, [])

  return (
    <AccountDcPanel title={t('account.section.orders.title')}>
      {orders.listError ? <StripeErrorBanner message={orders.listError} /> : null}

      <PageLoadTransition isLoading={isLoading} skeleton={<ListSkeleton />}>
        {orders.list && orders.list.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm font-medium text-idl-graphite">{t('account.orders.emptyTitle')}</p>
            <p className="mt-1 text-sm text-idl-muted">{t('account.orders.emptyDescription')}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to="/negozio" className={accountDcPrimaryBtnClass}>
                {t('nav.catalog')}
              </Link>
              <Link
                to="/account"
                className="inline-flex items-center justify-center rounded-lg border border-idl-tech-border px-[18px] py-3 text-[13.5px] font-bold text-idl-graphite"
              >
                {t('account.nav.dashboard')}
              </Link>
            </div>
          </div>
        ) : null}

        {orders.list && orders.list.length > 0 ? (
          <div className="flex flex-col gap-3.5">
            {orders.list.map((order) => (
              <AccountDcOrderCard key={order.id} order={order} />
            ))}
          </div>
        ) : null}
      </PageLoadTransition>
    </AccountDcPanel>
  )
}
