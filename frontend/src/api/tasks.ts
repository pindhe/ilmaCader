import { api, unwrapData, unwrapList } from '@/api/client'
import type { TaskItem } from '@/types'

export async function listTasks(familyId: string) {
  const { data } = await api.get('/tasks/', { params: { family: familyId } })
  return unwrapList<TaskItem>(data)
}

export async function createTask(
  payload: Partial<TaskItem> & { family: string; title: string },
) {
  const { data } = await api.post('/tasks/', payload)
  return unwrapData<TaskItem>(data)
}

export async function updateTask(id: string, payload: Partial<TaskItem>) {
  const { data } = await api.patch(`/tasks/${id}/`, payload)
  return unwrapData<TaskItem>(data)
}

export async function deleteTask(id: string) {
  await api.delete(`/tasks/${id}/`)
}
