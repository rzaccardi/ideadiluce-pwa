import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAdminAuth } from '@/context/admin-auth'
import { Skeleton } from '@/components/ui/skeleton'

export function ProtectedRoute() {
  const { user, loading } = useAdminAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-svh flex-col gap-4 bg-muted/20 p-8">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 flex-1 rounded-xl" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
