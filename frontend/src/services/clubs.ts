import { api } from '@/lib/axios'
import type { Club, ClubCategory, Paginated } from '@/types/club'

export type ClubFilters = {
  search?: string
  category?: string
  sort?: 'popular' | 'name'
}

export async function getClubs(filters: ClubFilters = {}) {
  const { data } = await api.get<Paginated<Club>>('/clubs', {
    params: { per_page: 50, ...filters },
  })

  return data
}

export async function getClubCategories() {
  const { data } = await api.get<ClubCategory[]>('/categories')

  return data
}

export async function getClub(id: string) {
  const { data } = await api.get<{ data: Club }>(`/clubs/${id}`)

  return data.data
}
