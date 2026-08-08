import { useIsAdmin } from '@/hooks/useIsAdmin'
import { AdminHomePage } from '@/pages/admin/AdminHomePage'
import { MemberPortalHome } from '@/pages/members/MemberPortalHome'

export function RoleHomePage() {
  const isAdmin = useIsAdmin()
  return isAdmin ? <AdminHomePage /> : <MemberPortalHome />
}
