import { apiClient, ApiError } from "@/lib/apiClient"
import type {
  LoginCredentials,
  RegisterData,
  AuthSession,
  User,
  PasswordResetRequest,
  PasswordResetConfirmRequest,
} from "@/types"

export function normalizeUser(raw: any): User {
  if (!raw) return raw
  return {
    id: raw.id || "",
    email: raw.email || "",
    fullName: raw.fullName || raw.full_name || "",
    role: raw.role || "CREATOR",
    isVerified: Boolean(raw.isVerified ?? raw.is_verified ?? false),
    status: raw.status || "ACTIVE",
    avatarUrl: raw.avatarUrl || raw.avatar_url,
    emailVerified: Boolean(raw.emailVerified ?? raw.email_verified ?? false),
    policyAccepted: Boolean(raw.policyAccepted ?? raw.policy_accepted ?? false),
    acceptedPolicyVersion: raw.acceptedPolicyVersion || raw.accepted_policy_version || undefined,
  }
}

export function normalizeAuthSession(raw: any): AuthSession {
  if (!raw) return raw
  const accessToken = raw.accessToken || raw.access_token || ""
  const tokenType = raw.tokenType || raw.token_type || "bearer"
  const user = normalizeUser(raw.user)
  const defaultRedirect = user?.role === "CREATOR" ? "/creator/dashboard" : "/brand/dashboard"
  const redirectPath = raw.redirectPath || raw.redirect_path || defaultRedirect

  return {
    accessToken,
    tokenType,
    user,
    redirectPath,
  }
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthSession> {
    const raw = await apiClient.post<any>("auth/login", {
      email: credentials.email,
      password: credentials.password,
      turnstile_token: credentials.turnstileToken,
      portal: credentials.portal,
    })
    const session = normalizeAuthSession(raw)
    if (session?.accessToken) {
      localStorage.setItem("creatorbridge_auth_token", session.accessToken)
      localStorage.setItem("creatorbridge_user", JSON.stringify(session.user))
      // Backwards-compatible fallback
      localStorage.setItem("hacxlerate_auth_token", session.accessToken)
      localStorage.setItem("hacxlerate_user", JSON.stringify(session.user))
    }
    return session
  },

  async register(data: RegisterData): Promise<AuthSession> {
    const raw = await apiClient.post<any>("auth/register", {
      email: data.email,
      password: data.password,
      confirm_password: data.confirmPassword,
      full_name: data.fullName,
      role: data.role,
      turnstile_token: data.turnstileToken,
      portal: data.portal,
      policy_accepted: data.policyAccepted ?? false,
      policy_version: data.policyVersion ?? "2026.1",
    })
    const session = normalizeAuthSession(raw)
    if (session?.accessToken) {
      localStorage.setItem("creatorbridge_auth_token", session.accessToken)
      localStorage.setItem("creatorbridge_user", JSON.stringify(session.user))
      // Backwards-compatible fallback
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

  clearSession(): void {
    try {
      localStorage.removeItem("creatorbridge_auth_token")
      localStorage.removeItem("creatorbridge_user")
      localStorage.removeItem("hacxlerate_auth_token")
      localStorage.removeItem("hacxlerate_user")
    } catch {
      // Ignore localStorage access failures
    }
  },

  async getCurrentUser(): Promise<User | null> {
    const token =
      localStorage.getItem("creatorbridge_auth_token") ||
      localStorage.getItem("hacxlerate_auth_token")
    if (!token) {
      return null
    }

    try {
      const raw = await apiClient.get<any>("auth/me")
      if (!raw) return null
      return normalizeUser(raw)
    } catch (err: unknown) {
      // If 401 Unauthorized, the stored token is definitively expired or invalid
      if (err instanceof ApiError && err.statusCode === 401) {
        this.clearSession()
      }
      return null
    }
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post<{ status: string }>("auth/logout", {})
    } catch {
      // ignore network errors on logout
    } finally {
      this.clearSession()
    }
  },

  getSavedUser(): User | null {
    try {
      const stored =
        localStorage.getItem("creatorbridge_user") ||
        localStorage.getItem("hacxlerate_user")
      if (!stored) return null
      const parsed = JSON.parse(stored)
      return normalizeUser(parsed)
    } catch {
      return null
    }
  },
}
