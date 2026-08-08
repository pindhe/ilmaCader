import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export const TOKEN_KEYS = {
  access: 'access_token',
  refresh: 'refresh_token',
} as const

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEYS.access)
}

export function getRefreshToken() {
  return localStorage.getItem(TOKEN_KEYS.refresh)
}

export function setTokens(access: string, refresh?: string) {
  localStorage.setItem(TOKEN_KEYS.access, access)
  if (refresh) localStorage.setItem(TOKEN_KEYS.refresh, refresh)
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEYS.access)
  localStorage.removeItem(TOKEN_KEYS.refresh)
}

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken()
  if (!refresh) return null

  try {
    const { data } = await axios.post(`${API_BASE}/auth/refresh/`, { refresh })
    const payload = data?.data ?? data
    const access = payload?.access as string | undefined
    const nextRefresh = (payload?.refresh as string | undefined) ?? refresh
    if (!access) return null
    setTokens(access, nextRefresh)
    return access
  } catch {
    clearTokens()
    return null
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null
      })
      const access = await refreshPromise
      if (access) {
        original.headers.Authorization = `Bearer ${access}`
        return api(original)
      }
    }
    return Promise.reject(error)
  },
)

export function unwrapData<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data
  }
  return payload as T
}

export function unwrapList<T>(payload: unknown): T[] {
  const data = unwrapData<unknown>(payload)
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object' && 'results' in data) {
    return (data as { results: T[] }).results ?? []
  }
  return []
}
