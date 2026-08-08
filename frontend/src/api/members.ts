import { api, unwrapData, unwrapList } from '@/api/client'
import type { FamilyMember, Relationship } from '@/types'

export async function listMembers(familyId: string) {
  const { data } = await api.get('/members/', { params: { family: familyId } })
  return unwrapList<FamilyMember>(data)
}

export async function getMember(id: string) {
  const { data } = await api.get(`/members/${id}/`)
  return unwrapData<FamilyMember>(data)
}

export async function createMember(payload: Partial<FamilyMember> & { family: string }) {
  const { data } = await api.post('/members/', payload)
  return unwrapData<FamilyMember>(data)
}

export async function updateMember(id: string, payload: Partial<FamilyMember>) {
  const { data } = await api.patch(`/members/${id}/`, payload)
  return unwrapData<FamilyMember>(data)
}

export async function deleteMember(id: string) {
  await api.delete(`/members/${id}/`)
}

export async function getFamilyTree(familyId: string) {
  const { data } = await api.get('/members/tree/', { params: { family: familyId } })
  return unwrapData<{ members: FamilyMember[]; relationships: Relationship[] }>(data)
}

export async function listRelationships(familyId: string) {
  const { data } = await api.get('/members/relationships/', {
    params: { family: familyId },
  })
  return unwrapList<Relationship>(data)
}

export async function createRelationship(
  payload: Partial<Relationship> & {
    family: string
    from_member: string
    to_member: string
    relation_type: string
  },
) {
  const { data } = await api.post('/members/relationships/', payload)
  return unwrapData<Relationship>(data)
}
