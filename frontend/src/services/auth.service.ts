import { apiClient } from "@/lib/apiClient"
import type {
  LoginCredentials,
  RegisterData,
  AuthSession,
  User,
  PasswordResetRequest,
  PasswordResetConfirmRequest,
} from "@/types"

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthSession> {
    const session = await apiClient.post<AuthSession>("auth/login", {
      email: credentials.email,
      password: credentials.password,
      turnstile_token: credentials.turnstileToken,
    })
    if (session?.accessToken) {
      localStorage.setItem("hacxlerate_auth_token", session.accessToken)
      localStorage.setItem("hacxlerate_user", JSON.stringify(session.user))
    }
    return session
  },

  async register(data: RegisterData): Promise<AuthSession> {
    const session = await apiClient.post<AuthSession>("auth/register", {
      email: data.email,
      password: data.password,
      confirm_password: data.confirmPassword,
      full_name: data.fullName,
      role: data.role,
      turnstile_token: data.turnstileToken,
    })
    if (session?.accessToken) {
      localStorage.setItem("hacxlerate_auth_token", session.accessToken)
      localStorage.setItem("hacxlerate_user", JSON.stringify(session.user))
    }
    return session
  },

  async requestPasswordReset(email: string, turnstileToken?: string): Promise<{ message: string }> {
    return await apiClient.post<{ message: string }>("auth/forgot-password", {
      email,
      turnstile_token: turnstileToken,
    })
  },

  async confirmPasswordReset(newPassword: string, accessToken: string): Promise<{ message: string }> {
    return await apiClient.post<{ message: string }>("auth/reset-password", {
      new_password: newPassword,
      access_token: accessToken,
    })
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      return await apiClient.get<User>("auth/me")
    } catch {
      return null
    }
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post<{ status: string }>("auth/logout", {})
    } catch {
      // ignore network errors on logout
    } finally {
      localStorage.removeItem("hacxlerate_auth_token")
      localStorage.removeItem("hacxlerate_user")
    }
  },

  getSavedUser(): User | null {
    try {
      const stored = localStorage.getItem("hacxlerate_user")
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  },
}
