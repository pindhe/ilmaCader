import { Navigate, Outlet } from 'react-router-dom'
import { useIsAdmin } from '@/hooks/useIsAdmin'

/** Blocks member users from admin-only management pages. */
export function AdminRoute() {
  const isAdmin = useIsAdmin()
  if (!isAdmin) {
    return <Navigate to="/app" replace />
  }
  return <Outlet />
}
