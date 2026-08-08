import { useIsAdmin } from '@/hooks/useIsAdmin'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { MemberHomePage } from '@/pages/members/MemberHomePage'

export function RoleHomePage() {
  const isAdmin = useIsAdmin()
  return isAdmin ? <DashboardPage /> : <MemberHomePage />
}
