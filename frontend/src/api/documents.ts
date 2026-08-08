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

export async function deleteDocument(id: string) {
  await api.delete(`/documents/${id}/`)
}
