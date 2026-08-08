import { api, unwrapData, unwrapList } from '@/api/client'
import type { DashboardStats, Family, FamilyMembership } from '@/types'

export async function listFamilies() {
  const { data } = await api.get('/families/')
  return unwrapList<Family>(data)
}

export async function getFamily(id: string) {
  const { data } = await api.get(`/families/${id}/`)
  return unwrapData<Family>(data)
}

export async function updateFamily(id: string, payload: Partial<Family>) {
  const { data } = await api.patch(`/families/${id}/`, payload)
  return unwrapData<Family>(data)
}

export async function getFamilyProfile(familyId: string) {
  const { data } = await api.get(`/families/profile/${familyId}/`)
  return unwrapData<Family>(data)
}

export async function getDashboardStats(familyId: string) {
  const { data } = await api.get('/families/dashboard-stats/', {
    params: { family: familyId },
  })
  return unwrapData<DashboardStats>(data)
}

export async function listMemberships(familyId?: string) {
  const { data } = await api.get('/families/memberships/', {
    params: familyId ? { family: familyId } : undefined,
  })
  return unwrapList<FamilyMembership>(data)
}
