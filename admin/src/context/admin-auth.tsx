import { useEffect, type ReactNode } from 'react'
import { useSnapshot } from 'valtio/react'
import {
  adminAuthStore,
  adminLogin,
  adminLogout,
  fetchAdminMe,
  type AdminUser,
} from '@/features/auth'

export type { AdminUser }

type AdminAuthContextValue = {
  user: AdminUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

/** Provider di compatibilità: lo stato vive in `adminAuthStore` (Valtio). */
export function AdminAuthProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    void fetchAdminMe()
  }, [])

  return <>{children}</>
}

export function useAdminAuth(): AdminAuthContextValue {
  const auth = useSnapshot(adminAuthStore)
  return {
    user: auth.user,
    loading: auth.isLoading,
    login: adminLogin,
    logout: adminLogout,
    refresh: fetchAdminMe,
  }
}
