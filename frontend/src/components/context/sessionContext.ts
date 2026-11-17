import { createContext } from 'react'
import type { Session, User } from '@/types'
import type { RegistrationPayload } from '@/services/auth'

export type AuthContextValue = {
  user: User | null
  loading: boolean
  saveSession: (session: Session) => void
  setUser: (user: User) => void
  signIn: (identifier: string, password: string) => Promise<void>
  signUp: (payload: RegistrationPayload) => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
