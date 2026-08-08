import { api, unwrapData, unwrapList } from '@/api/client'
import type { Family, User } from '@/types'

export async function listAllFamilies() {
  const { data } = await api.get('/admin/families/')
  return unwrapList<Family>(data)
}

export async function listAllUsers() {
  const { data } = await api.get('/admin/users/')
  return unwrapList<User>(data)
}

export async function getAdminStats() {
  const { data } = await api.get('/admin/stats/')
  return unwrapData<{
    families: number
    users: number
    members: number
    active_families: number
  }>(data)
}
