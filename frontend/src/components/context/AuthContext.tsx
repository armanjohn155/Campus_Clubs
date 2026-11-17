import { useEffect, useMemo, useState, type ReactNode } from 'react'
import * as authService from '@/services/auth'
import type { Session, User } from '@/types'
import { AuthContext, type AuthContextValue } from '@/components/context/sessionContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const clearSession = () => {
    localStorage.removeItem('token')
    setUserState(null)
  }

  const saveSession = (session: Session) => {
    localStorage.setItem('token', session.token)
    setUserState(session.user)
  }

  useEffect(() => {
    let active = true
    const token = localStorage.getItem('token')
    const onUnauthorized = () => {
      clearSession()
      setLoading(false)
    }

    window.addEventListener('campusclubs:unauthorized', onUnauthorized)
    const restoreSession = async () => {
      await Promise.resolve()
      if (!active) return
      if (!token) { setLoading(false); return }
      try { setUserState(await authService.getMe()) }
      catch { clearSession() }
      finally { setLoading(false) }
    }
    void restoreSession()

    return () => {
      active = false
      window.removeEventListener('campusclubs:unauthorized', onUnauthorized)
    }
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    saveSession,
    setUser: setUserState,
    async signIn(identifier, password) {
      saveSession(await authService.login(identifier, password))
    },
    async signUp(payload) {
      saveSession(await authService.register(payload))
    },
    async signOut() {
      try {
        if (localStorage.getItem('token')) await authService.logout()
      } finally {
        clearSession()
      }
    },
  }), [user, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
