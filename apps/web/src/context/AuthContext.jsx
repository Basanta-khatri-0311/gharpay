import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { auth as authApi, setAccessToken, getAccessToken } from '../lib/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined) // undefined = loading, null = logged out
  const [accessToken, _setAccessToken] = useState(null)

  const applyToken = useCallback((token) => {
    setAccessToken(token)       // keeps the module-level var in sync
    _setAccessToken(token)
  }, [])

  /* ── Silent refresh on mount ── */
  useEffect(() => {
    authApi.refresh()
      .then(({ user, accessToken }) => {
        applyToken(accessToken)
        setUser(user)
      })
      .catch(() => {
        applyToken(null)
        setUser(null)
      })
  }, [applyToken])

  /* ── Register ── */
  const register = useCallback(async (body) => {
    const data = await authApi.register(body)
    // Registration doesn't log in automatically — redirect to login
    return data
  }, [])

  /* ── Login ── */
  const login = useCallback(async (body) => {
    const data = await authApi.login(body)
    applyToken(data.accessToken)
    setUser(data.user)
    return data
  }, [applyToken])

  /* ── Logout ── */
  const logout = useCallback(async () => {
    await authApi.logout().catch(() => {}) // best-effort
    applyToken(null)
    setUser(null)
  }, [applyToken])

  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout, register, isLoading: user === undefined }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
