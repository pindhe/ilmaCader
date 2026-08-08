import { api, unwrapData, unwrapList } from '@/api/client'
import type { DocumentItem } from '@/types'

export async function listDocuments(familyId: string) {
  const { data } = await api.get('/documents/', { params: { family: familyId } })
  return unwrapList<DocumentItem>(data)
}

export async function createDocument(formData: FormData) {
  const { data } = await api.post('/documents/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return unwrapData<DocumentItem>(data)
}

export async function updateDocument(id: string, formData: FormData) {
  const { data } = await api.patch(`/documents/${id}/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    params: formData.get('family') ? { family: String(formData.get('family')) } : undefined,
  })
  return unwrapData<DocumentItem>(data)
}

export async function deleteDocument(id: string, familyId?: string) {
  await api.delete(`/documents/${id}/`, {
    params: familyId ? { family: familyId } : undefined,
  })
}
