import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import type { User, LoginCredentials, RegisterData, AuthSession } from "@/types"
import { authService } from "@/services/auth.service"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  isCreator: boolean
  isBrand: boolean
  isAdmin: boolean
  login: (credentials: LoginCredentials) => Promise<AuthSession>
  register: (data: RegisterData) => Promise<AuthSession>
  requestPasswordReset: (email: string, turnstileToken?: string) => Promise<{ message: string }>
  confirmPasswordReset: (newPassword: string, accessToken: string) => Promise<{ message: string }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    // Check local storage session on initial mount
    const saved = authService.getSavedUser()
    if (saved) {
      setUser(saved)
    }
    // Verify authoritative session with backend
    authService
      .getCurrentUser()
      .then((current) => {
        if (current) setUser(current)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  const login = useCallback(async (credentials: LoginCredentials): Promise<AuthSession> => {
    setIsLoading(true)
    try {
      const session = await authService.login(credentials)
      setUser(session.user)
      return session
    } finally {
      setIsLoading(false)
    }
  }, [])

  const register = useCallback(async (data: RegisterData): Promise<AuthSession> => {
    setIsLoading(true)
    try {
      const session = await authService.register(data)
      setUser(session.user)
      return session
    } finally {
      setIsLoading(false)
    }
  }, [])

  const requestPasswordReset = useCallback(
    async (email: string, turnstileToken?: string): Promise<{ message: string }> => {
      return await authService.requestPasswordReset(email, turnstileToken)
    },
    []
  )

  const confirmPasswordReset = useCallback(
    async (newPassword: string, accessToken: string): Promise<{ message: string }> => {
      return await authService.confirmPasswordReset(newPassword, accessToken)
    },
    []
  )

  const logout = useCallback(async () => {
    await authService.logout()
    setUser(null)
  }, [])

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isCreator: user?.role === "CREATOR",
    isBrand: user?.role === "BRAND" || user?.role === "AGENCY",
    isAdmin: user?.role === "ADMIN",
    login,
    register,
    requestPasswordReset,
    confirmPasswordReset,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
