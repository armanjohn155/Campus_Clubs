import { api } from '@/lib/axios'
import type { Announcement } from '@/types'

export async function getAnnouncements(): Promise<Announcement[]> {
  const { data } = await api.get<Announcement[]>('/announcements')
  return data
}

export async function createAnnouncement(clubId: number, payload: { title: string; body: string }): Promise<Announcement> {
  const { data } = await api.post<Announcement>(`/clubs/${clubId}/announcements`, payload)
  return data
}

export async function updateAnnouncement(id: number, payload: { title: string; body: string }): Promise<Announcement> {
  const { data } = await api.put<Announcement>(`/announcements/${id}`, payload)
  return data
}

export async function deleteAnnouncement(id: number): Promise<void> {
  await api.delete(`/announcements/${id}`)
}
