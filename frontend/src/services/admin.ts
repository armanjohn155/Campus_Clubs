import { api } from '@/lib/axios'
import type { AdminReport, Club, Paginated, User } from '@/types'

export async function getAdminClubs(): Promise<Club[]> {
  const { data } = await api.get<{ data: Club[] }>('/clubs')
  return data.data
}

export async function updateClubStatus(id: number, status: 'active' | 'rejected'): Promise<void> {
  await api.patch(`/admin/clubs/${id}/status`, { status })
}

export async function getAdminUsers(): Promise<User[]> {
  const { data } = await api.get<Paginated<User>>('/admin/users')
  return data.data
}

export async function toggleUser(id: number): Promise<{ id: number; is_active: boolean }> {
  const { data } = await api.patch<{ id: number; is_active: boolean }>(`/admin/users/${id}/toggle`)
  return data
}

export async function getAdminReports(): Promise<AdminReport> {
  const { data } = await api.get<AdminReport>('/admin/reports')
  return data
}
