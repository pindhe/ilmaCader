import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { LoadingState } from '@/components/shared/StateBlocks'
import { useAuthStore } from '@/stores/authStore'

export function ProtectedRoute() {
  const location = useLocation()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isLoading = useAuthStore((s) => s.isLoading)
  const user = useAuthStore((s) => s.user)

  if (isLoading && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState label="Checking session…" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}

export function SuperAdminRoute() {
  const user = useAuthStore((s) => s.user)
  if (!user?.is_superuser) {
    return <Navigate to="/forbidden" replace />
  }
  return <Outlet />
}
