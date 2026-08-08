import { api, unwrapData, unwrapList } from '@/api/client'
import type { ActivityLog, NotificationItem } from '@/types'

export async function listNotifications() {
  const { data } = await api.get('/notifications/')
  return unwrapList<NotificationItem>(data)
}

export async function markNotificationRead(id: string) {
  const { data } = await api.patch(`/notifications/${id}/`, { is_read: true })
  return unwrapData<NotificationItem>(data)
}

export async function listActivityLogs(familyId: string) {
  const { data } = await api.get('/reports/activity/', { params: { family: familyId } })
  return unwrapList<ActivityLog>(data)
}
