import { api } from '@/lib/axios'
import type { Membership } from '@/types'

type ResourceList<T> = { data: T[] }

export async function getClubRequests(clubId: number): Promise<Membership[]> {
  const { data } = await api.get<ResourceList<Membership>>(`/clubs/${clubId}/requests`)
  return data.data
}

export async function getClubMembers(clubId: number): Promise<Membership[]> {
  const { data } = await api.get<ResourceList<Membership>>(`/clubs/${clubId}/members`)
  return data.data
}

export async function updateMembership(
  membershipId: number,
  payload: { status?: 'approved' | 'rejected' | 'removed'; role?: string },
): Promise<{ status: string; role: string }> {
  const { data } = await api.patch(`/memberships/${membershipId}`, payload)
  return data
}
