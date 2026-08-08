import { useIsAdmin } from '@/hooks/useIsAdmin'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { MemberPortalHome } from '@/pages/members/MemberPortalHome'

export function RoleHomePage() {
  const isAdmin = useIsAdmin()
  return isAdmin ? <DashboardPage /> : <MemberPortalHome />
}
