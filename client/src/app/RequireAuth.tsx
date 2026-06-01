import { Navigate, useLocation } from 'react-router-dom'
import { useSnapshot } from 'valtio/react'
import { authStore } from '@/features/auth'
import { LoadingState } from '@/components/LoadingState'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const auth = useSnapshot(authStore)
  const location = useLocation()

  if (auth.isLoading && !auth.me && auth.error == null) {
    return <LoadingState message="Verifica sessione…" />
  }

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}
