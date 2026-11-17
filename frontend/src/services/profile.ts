import { api } from '@/lib/axios'
import type { User } from '@/types'

export type ProfilePayload = {
  full_name: string
  email: string
  phone?: string
  address?: string
  course?: string
  year_level: number
  section?: string
  skills: string[]
}

export async function updateProfile(payload: ProfilePayload): Promise<User> {
  const { data } = await api.put<User>('/profile', payload)
  return data
}

export async function getSkills(): Promise<string[]> {
  const { data } = await api.get<string[]>('/skills')
  return data
}

export async function uploadProfilePhoto(file: File): Promise<{ photo_url: string }> {
  const body = new FormData()
  body.append('photo', file)
  const { data } = await api.post<{ photo_url: string }>('/profile/photo', body)
  return data
}
