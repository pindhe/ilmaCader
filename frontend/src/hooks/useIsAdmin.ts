import { useAuthStore } from '@/stores/authStore'

export function useIsAdmin() {
  const user = useAuthStore((s) => s.user)
  return Boolean(user?.is_superuser || user?.role === 'admin')
}

export function useIsMember() {
  const user = useAuthStore((s) => s.user)
  return Boolean(user && user.role === 'member' && !user.is_superuser)
}
