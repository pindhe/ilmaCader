import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import * as authApi from '@/api/auth'
import { clearTokens, getAccessToken } from '@/api/client'
import { listFamilies } from '@/api/families'
import type { Family, User } from '@/types'

interface AuthState {
  user: User | null
  family: Family | null
  families: Family[]
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: User | null) => void
  setFamily: (family: Family | null) => void
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>
  register: (payload: authApi.RegisterPayload) => Promise<void>
  logout: () => Promise<void>
  hydrate: () => Promise<void>
  refreshFamilies: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      family: null,
      families: [],
      isAuthenticated: Boolean(getAccessToken()),
      isLoading: false,

      setUser: (user) => set({ user, isAuthenticated: Boolean(user) }),
      setFamily: (family) => set({ family }),

      login: async (email, password, rememberMe = false) => {
        set({ isLoading: true })
        try {
          const result = await authApi.login({
            email,
            password,
            remember_me: rememberMe,
          })
          const families = await listFamilies().catch(() => [])
          set({
            user: result.user,
            families,
            family: families[0] ?? null,
            isAuthenticated: true,
          })
        } finally {
          set({ isLoading: false })
        }
      },

      register: async (payload) => {
        set({ isLoading: true })
        try {
          await authApi.register(payload)
        } finally {
          set({ isLoading: false })
        }
      },

      logout: async () => {
        try {
          await authApi.logout()
        } finally {
          clearTokens()
          set({
            user: null,
            family: null,
            families: [],
            isAuthenticated: false,
          })
        }
      },

      hydrate: async () => {
        if (!getAccessToken()) {
          set({ isAuthenticated: false, user: null })
          return
        }
        set({ isLoading: true })
        try {
          const user = await authApi.getMe()
          const families = await listFamilies().catch(() => [])
          const current = get().family
          const family =
            (current && families.find((f) => f.id === current.id)) || families[0] || null
          set({ user, families, family, isAuthenticated: true })
        } catch {
          clearTokens()
          set({ user: null, family: null, families: [], isAuthenticated: false })
        } finally {
          set({ isLoading: false })
        }
      },

      refreshFamilies: async () => {
        const families = await listFamilies().catch(() => [])
        const current = get().family
        set({
          families,
          family:
            (current && families.find((f) => f.id === current.id)) || families[0] || null,
        })
      },
    }),
    {
      name: 'fdc-auth',
      partialize: (state) => ({
        user: state.user,
        family: state.family,
        families: state.families,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
