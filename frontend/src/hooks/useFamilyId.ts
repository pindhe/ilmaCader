import { useAuthStore } from '@/stores/authStore'

export function useFamilyId() {
  return useAuthStore((s) => s.family?.id)
}

export function useFamily() {
  return useAuthStore((s) => s.family)
}
