import { api } from '@/lib/axios'
import type { NotificationList } from '@/types'

export async function getNotifications(): Promise<NotificationList> {
  const { data } = await api.get<NotificationList>('/notifications')
  return data
}

export async function markNotificationRead(id: number): Promise<void> {
  await api.patch(`/notifications/${id}/read`)
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.patch('/notifications/read-all')
}
