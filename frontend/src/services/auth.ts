import { api } from '@/lib/axios'
import type { Session, User } from '@/types'

export type RegistrationPayload = {
  student_id: string
  full_name: string
  email: string
  password: string
  password_confirmation: string
}

export async function register(payload: RegistrationPayload): Promise<Session> {
  const { data } = await api.post<Session>('/register', payload)
  return data
}

export async function login(identifier: string, password: string): Promise<Session> {
  const { data } = await api.post<Session>('/login', { identifier, password })
  return data
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<User>('/me')
  return data
}

export async function logout(): Promise<void> {
  await api.post('/logout')
}

export async function sendPasswordReset(email: string): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>('/forgot-password', { email })
  return data
}

export async function resetPassword(payload: {
  token: string
  email: string
  password: string
  password_confirmation: string
}): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>('/reset-password', payload)
  return data
}
