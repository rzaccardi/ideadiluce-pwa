'use client'

import { useEffect } from 'react'
import { AccountNav } from '@/components/account/AccountNav'
import { AccountShell } from '@/components/account/AccountShell'
import { authStore } from '@/features/auth'
import { fetchOrdersList } from '@/features/orders'
import { useSnapshot } from 'valtio/react'

export function AccountLayout({ children }: { children: React.ReactNode }) {
  const auth = useSnapshot(authStore)
  const user = auth.me

  useEffect(() => {
    void fetchOrdersList()
  }, [])

  if (!user) {
    return null
  }

  return (
    <AccountShell user={user} nav={<AccountNav />}>
      {children}
    </AccountShell>
  )
}
