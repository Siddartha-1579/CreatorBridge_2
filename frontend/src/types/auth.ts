export type UserRole = "CREATOR" | "BRAND" | "AGENCY" | "ADMIN"

export interface User {
  id: string
  email: string
  fullName: string
  role: UserRole
  isVerified: boolean
  status?: string
  avatarUrl?: string
  emailVerified?: boolean
}

export interface LoginCredentials {
  email: string
  password?: string
  turnstileToken?: string
  portal?: string
}

export interface RegisterData {
  email: string
  password?: string
  confirmPassword?: string
  fullName: string
  role: UserRole
  turnstileToken?: string
}

export interface PasswordResetRequest {
  email: string
  turnstileToken?: string
}

export interface PasswordResetConfirmRequest {
  newPassword: string
  accessToken: string
}

export interface AuthSession {
  accessToken: string
  tokenType?: string
  user: User
  redirectPath?: string
}
