import { api, clearTokens, setTokens, unwrapData } from '@/api/client'
import type { ApiResponse, AuthTokens, User } from '@/types'

export interface LoginPayload {
  email: string
  password: string
  remember_me?: boolean
}

export async function login(payload: LoginPayload) {
  const { data } = await api.post<ApiResponse<{ user: User; tokens: AuthTokens }>>(
    '/auth/login/',
    payload,
  )
  const result = unwrapData<{ user: User; tokens: AuthTokens }>(data)
  setTokens(result.tokens.access, result.tokens.refresh)
  return result
}

export async function logout() {
  const refresh = localStorage.getItem('refresh_token')
  try {
    if (refresh) await api.post('/auth/logout/', { refresh })
  } finally {
    clearTokens()
  }
}

export async function getMe() {
  const { data } = await api.get<ApiResponse<User>>('/auth/me/')
  return unwrapData<User>(data)
}

export async function updateMe(payload: Partial<User>) {
  const { data } = await api.patch<ApiResponse<User>>('/auth/me/', payload)
  return unwrapData<User>(data)
}

export async function changePassword(payload: {
  current_password: string
  new_password: string
  confirm_password: string
}) {
  const { data } = await api.post('/auth/change-password/', payload)
  return unwrapData(data)
}

export async function getLoginHistory() {
  const { data } = await api.get('/auth/login-history/')
  return unwrapData(data)
}

export async function createAdminAccount(payload: {
  email: string
  password: string
  confirm_password?: string
  full_name?: string
  family?: string
}) {
  const { data } = await api.post('/auth/create-admin/', {
    ...payload,
    confirm_password: payload.confirm_password ?? payload.password,
  })
  return unwrapData<{ email: string }>(data)
}
