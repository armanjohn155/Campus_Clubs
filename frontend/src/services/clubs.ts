import { api } from '@/lib/axios'
import type { Club, ClubCategory } from '@/types'

export type ClubFilters = {
  search?: string
  category?: string
  sort?: 'recommended' | 'popular' | 'name'
}

type ResourceList<T> = { data: T[] }

export async function getClubs(filters: ClubFilters = {}): Promise<Club[]> {
  const { data } = await api.get<ResourceList<Club>>('/clubs', { params: filters })
  return data.data
}

export async function getClubCategories(): Promise<ClubCategory[]> {
  const { data } = await api.get<ClubCategory[]>('/categories')
  return data
}

export async function getClub(id: number | string): Promise<Club> {
  const { data } = await api.get<{ data: Club }>(`/clubs/${id}`)
  return data.data
}

export async function getMyClubs(): Promise<Club[]> {
  const { data } = await api.get<ResourceList<Club>>('/my-clubs')
  return data.data
}

export async function requestToJoin(id: number, message?: string): Promise<void> {
  await api.post(`/clubs/${id}/join`, { message })
}

export async function cancelJoinRequest(id: number): Promise<void> {
  await api.delete(`/clubs/${id}/join`)
}

export async function leaveClub(id: number): Promise<void> {
  await api.delete(`/clubs/${id}/leave`)
}

export async function createClub(payload: {
  name: string
  category_id: number
  description: string
  adviser_name?: string
  meeting_schedule?: string
  contact_email?: string
  tags: string[]
}): Promise<Club> {
  const { data } = await api.post<{ data: Club }>('/clubs', payload)
  return data.data
}
