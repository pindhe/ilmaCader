import { useIsAdmin } from '@/hooks/useIsAdmin'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { MemberLayout } from '@/layouts/MemberLayout'

/** Admin keeps sidebar dashboard; members use navbar + footer. */
export function RoleLayout() {
  const isAdmin = useIsAdmin()
  return isAdmin ? <DashboardLayout /> : <MemberLayout />
}
