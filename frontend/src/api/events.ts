import { api, unwrapData, unwrapList } from '@/api/client'
import type { Announcement, EventItem } from '@/types'

export async function listEvents(familyId: string) {
  const { data } = await api.get('/events/', { params: { family: familyId } })
  return unwrapList<EventItem>(data)
}

export async function createEvent(
  payload: Partial<EventItem> & { family: string; name: string; date: string },
) {
  const { data } = await api.post('/events/', payload)
  return unwrapData<EventItem>(data)
}

export async function updateEvent(id: string, payload: Partial<EventItem>) {
  const { data } = await api.patch(`/events/${id}/`, payload)
  return unwrapData<EventItem>(data)
}

export async function deleteEvent(id: string) {
  await api.delete(`/events/${id}/`)
}

export async function listAnnouncements(familyId: string) {
  const { data } = await api.get('/events/announcements/', { params: { family: familyId } })
  return unwrapList<Announcement>(data)
}

export async function createAnnouncement(
  payload: Partial<Announcement> & { family: string; title: string; message: string },
) {
  const { data } = await api.post('/events/announcements/', payload)
  return unwrapData<Announcement>(data)
}
