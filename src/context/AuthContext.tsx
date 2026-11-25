import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, getToken, setToken } from '../lib/api'

export interface AuthUser {
  id: number
  fullName: string
  email: string
  roles: string[]
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Validate existing token on mount
  useEffect(() => {
    const token = getToken()
    if (!token) {
      setLoading(false)
      return
    }
    api.get<{ user: AuthUser }>('/auth/me')
      .then((res) => setUser(res.user))
      .catch(() => {
        setToken(null)
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  // Handle 401 unauthorized events from any API call
  useEffect(() => {
    const onUnauth = () => setUser(null)
    window.addEventListener('auth:unauthorized', onUnauth)
    return () => window.removeEventListener('auth:unauthorized', onUnauth)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<{ token: string; user: AuthUser }>('/auth/login', { email, password })
    setToken(res.token)
    setUser(res.user)
  }, [])

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout', {}) } catch { /* ignore */ }
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
